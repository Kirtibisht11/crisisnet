# backend/api/ngo.py
from flask import Blueprint, jsonify, request
from datetime import datetime
import json

ngo_bp = Blueprint('ngo', __name__, url_prefix='/api/ngo')

# Mock database - replace with actual database in production
class NGODatabase:
    def __init__(self):
        self.crises = []
        self.accepted_tasks = {}
        
    def get_active_crises(self):
        """
        Get all active, verified crises suitable for NGO response
        These should be pre-filtered and processed by agents
        """
        # In production, this would query from agent-processed crisis data
        return self.crises
    
    def accept_crisis(self, ngo_id, crisis_id):
        """
        Mark a crisis as accepted by an NGO
        """
        if ngo_id not in self.accepted_tasks:
            self.accepted_tasks[ngo_id] = []
        
        crisis = next((c for c in self.crises if c['id'] == crisis_id), None)
        if crisis:
            task = {
                'id': crisis_id,
                'type': crisis['type'],
                'location': crisis['location'],
                'status': 'Pending',
                'acceptedAt': datetime.now().strftime('%Y-%m-%d')
            }
            self.accepted_tasks[ngo_id].append(task)
            # Remove from active crises
            self.crises = [c for c in self.crises if c['id'] != crisis_id]
            return task
        return None
    
    def get_accepted_tasks(self, ngo_id):
        """
        Get all tasks accepted by a specific NGO
        """
        return self.accepted_tasks.get(ngo_id, [])
    
    def update_task_status(self, ngo_id, task_id, new_status):
        """
        Update the status of an accepted task
        """
        if ngo_id in self.accepted_tasks:
            for task in self.accepted_tasks[ngo_id]:
                if task['id'] == task_id:
                    task['status'] = new_status
                    task['updatedAt'] = datetime.now().isoformat()
                    return task
        return None

# Initialize database
db = NGODatabase()

# Seed with sample data
db.crises = [
    {
        "id": "CR-202",
        "type": "Flood",
        "location": "Sector 21, North District",
        "severity": "HIGH",
        "resources": ["Food", "Shelter", "Medical"],
        "trust": 0.87,
        "description": "Severe flooding affecting 200+ families. Immediate evacuation and shelter needed.",
        "sources": 15,
        "timestamp": "2 hours ago",
        "coordinates": {"lat": 28.7041, "lng": 77.1025}
    },
    {
        "id": "CR-203",
        "type": "Fire",
        "location": "Industrial Area B",
        "severity": "MEDIUM",
        "resources": ["Medical", "Food"],
        "trust": 0.72,
        "description": "Factory fire contained but workers need medical attention and temporary support.",
        "sources": 8,
        "timestamp": "4 hours ago",
        "coordinates": {"lat": 28.6139, "lng": 77.2090}
    },
    {
        "id": "CR-204",
        "type": "Medical Emergency",
        "location": "Rural Village - Sector 45",
        "severity": "HIGH",
        "resources": ["Medical", "Transport"],
        "trust": 0.91,
        "description": "Disease outbreak reported. Mobile medical unit urgently required.",
        "sources": 12,
        "timestamp": "30 minutes ago",
        "coordinates": {"lat": 28.5355, "lng": 77.3910}
    }
]

@ngo_bp.route('/active-crises', methods=['GET'])
def get_active_crises():
    """
    GET /api/ngo/active-crises
    Returns all active crises available for NGOs to accept
    
    Response:
    {
        "crises": [
            {
                "id": "CR-202",
                "type": "Flood",
                "location": "Sector 21",
                "severity": "HIGH",
                "resources": ["Food", "Shelter"],
                "trust": 0.87,
                "description": "...",
                "sources": 15,
                "timestamp": "2 hours ago"
            }
        ]
    }
    """
    try:
        crises = db.get_active_crises()
        
        # Optional: Filter by query parameters
        severity = request.args.get('severity')
        if severity:
            crises = [c for c in crises if c['severity'] == severity.upper()]
        
        return jsonify({
            "success": True,
            "crises": crises,
            "count": len(crises)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ngo_bp.route('/accept', methods=['POST'])
def accept_crisis():
    """
    POST /api/ngo/accept
    Accept responsibility for a crisis
    
    Request body:
    {
        "crisisId": "CR-202"
    }
    
    Response:
    {
        "success": true,
        "crisisId": "CR-202",
        "message": "Crisis accepted successfully"
    }
    """
    try:
        data = request.get_json()
        crisis_id = data.get('crisisId')
        
        if not crisis_id:
            return jsonify({
                "success": False,
                "error": "Crisis ID is required"
            }), 400
        
        # In production, get NGO ID from authentication
        ngo_id = request.headers.get('X-NGO-ID', 'ngo_default')
        
        task = db.accept_crisis(ngo_id, crisis_id)
        
        if task:
            return jsonify({
                "success": True,
                "crisisId": crisis_id,
                "task": task,
                "message": "Crisis accepted successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Crisis not found or already accepted"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ngo_bp.route('/tasks', methods=['GET'])
def get_accepted_tasks():
    """
    GET /api/ngo/tasks
    Get all tasks accepted by this NGO
    
    Response:
    {
        "tasks": [
            {
                "id": "CR-198",
                "type": "Earthquake",
                "location": "Downtown Area",
                "status": "In Progress",
                "acceptedAt": "2024-12-28"
            }
        ]
    }
    """
    try:
        # In production, get NGO ID from authentication
        ngo_id = request.headers.get('X-NGO-ID', 'ngo_default')
        
        tasks = db.get_accepted_tasks(ngo_id)
        
        return jsonify({
            "success": True,
            "tasks": tasks,
            "count": len(tasks)
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ngo_bp.route('/tasks/<task_id>/status', methods=['PATCH'])
def update_task_status(task_id):
    """
    PATCH /api/ngo/tasks/<task_id>/status
    Update the status of an accepted task
    
    Request body:
    {
        "status": "In Progress" | "Completed" | "Pending"
    }
    
    Response:
    {
        "success": true,
        "task": {...}
    }
    """
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({
                "success": False,
                "error": "Status is required"
            }), 400
        
        valid_statuses = ['Pending', 'In Progress', 'Completed']
        if new_status not in valid_statuses:
            return jsonify({
                "success": False,
                "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }), 400
        
        # In production, get NGO ID from authentication
        ngo_id = request.headers.get('X-NGO-ID', 'ngo_default')
        
        task = db.update_task_status(ngo_id, task_id, new_status)
        
        if task:
            return jsonify({
                "success": True,
                "task": task,
                "message": "Task status updated successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "error": "Task not found"
            }), 404
            
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# Register blueprint in your main app:
# from api.ngo import ngo_bp
# app.register_blueprint(ngo_bp)