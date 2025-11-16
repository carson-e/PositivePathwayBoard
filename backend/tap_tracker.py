"""
Tap Tracker Module
Manages storage and retrieval of positive and negative tap interactions for students
"""

import sqlite3
from datetime import datetime
from typing import List, Dict, Tuple, Optional
import os


class TapTracker:
    """Track student behavioral taps (positive and negative interactions)"""
    
    def __init__(self, db_path: str = None):
        """Initialize tap tracker with database connection"""
        if db_path is None:
            db_path = os.path.join(os.path.dirname(__file__), 'taps.db')
        self.db_path = db_path
        self._init_database()
    
    def _init_database(self):
        """Create taps table if it doesn't exist"""
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS taps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT NOT NULL,
                tap_type TEXT NOT NULL CHECK(tap_type IN ('positive', 'negative')),
                choice TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                date TEXT NOT NULL,
                month TEXT NOT NULL,
                year INTEGER NOT NULL
            )
        """)
        
        # Create index for faster queries
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_student_date 
            ON taps(student_name, date)
        """)
        
        cur.execute("""
            CREATE INDEX IF NOT EXISTS idx_student_month 
            ON taps(student_name, month, year)
        """)
        
        conn.commit()
        conn.close()
    
    def record_tap(self, student_name: str, tap_type: str, choice: str) -> int:
        """
        Record a single tap interaction
        
        Args:
            student_name: Name of the student
            tap_type: 'positive' or 'negative'
            choice: The choice/behavior description
            
        Returns:
            The ID of the inserted record
        """
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        month_str = now.strftime('%B')  # Full month name
        year = now.year
        
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO taps (student_name, tap_type, choice, date, month, year)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (student_name, tap_type, choice, date_str, month_str, year))
        
        tap_id = cur.lastrowid
        conn.commit()
        conn.close()
        
        return tap_id
    
    def record_multiple_taps(self, taps: List[Dict]) -> List[int]:
        """
        Record multiple tap interactions at once
        
        Args:
            taps: List of dicts with keys: student_name, tap_type, choice
            
        Returns:
            List of inserted record IDs
        """
        now = datetime.now()
        date_str = now.strftime('%Y-%m-%d')
        month_str = now.strftime('%B')
        year = now.year
        
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        tap_ids = []
        for tap in taps:
            cur.execute("""
                INSERT INTO taps (student_name, tap_type, choice, date, month, year)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (tap['student_name'], tap['tap_type'], tap['choice'], date_str, month_str, year))
            tap_ids.append(cur.lastrowid)
        
        conn.commit()
        conn.close()
        
        return tap_ids
    
    def get_taps_for_student(
        self, 
        student_name: str, 
        month: Optional[str] = None,
        year: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Get tap summary and details for a specific student
        
        Args:
            student_name: Name of the student
            month: Optional month name filter (e.g., 'November')
            year: Optional year filter
            
        Returns:
            Dictionary with positive_taps, negative_taps, daily_data
        """
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        # Build query with optional filters
        where_clauses = ["student_name = ?"]
        params = [student_name]
        
        if month:
            where_clauses.append("month = ?")
            params.append(month)
        
        if year:
            where_clauses.append("year = ?")
            params.append(year)
        
        where_sql = " AND ".join(where_clauses)
        
        # Get positive count
        cur.execute(f"""
            SELECT COUNT(*) FROM taps 
            WHERE {where_sql} AND tap_type = 'positive'
        """, params)
        positive_taps = cur.fetchone()[0]
        
        # Get negative count
        cur.execute(f"""
            SELECT COUNT(*) FROM taps 
            WHERE {where_sql} AND tap_type = 'negative'
        """, params)
        negative_taps = cur.fetchone()[0]
        
        # Get daily breakdown
        cur.execute(f"""
            SELECT 
                date,
                SUM(CASE WHEN tap_type = 'positive' THEN 1 ELSE 0 END) as positive_count,
                SUM(CASE WHEN tap_type = 'negative' THEN 1 ELSE 0 END) as negative_count
            FROM taps
            WHERE {where_sql}
            GROUP BY date
            ORDER BY date DESC
            LIMIT 30
        """, params)
        
        daily_data = []
        for row in cur.fetchall():
            daily_data.append([row[0], str(row[1]), str(row[2])])
        
        conn.close()
        
        return {
            'positive_taps': positive_taps,
            'negative_taps': negative_taps,
            'daily_data': daily_data
        }
    
    def get_all_students_taps(
        self, 
        month: Optional[str] = None,
        year: Optional[int] = None
    ) -> Dict[str, Dict]:
        """
        Get tap data for all students
        
        Args:
            month: Optional month name filter
            year: Optional year filter
            
        Returns:
            Dictionary mapping student names to their tap data
        """
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        # Build query with optional filters
        where_clauses = []
        params = []
        
        if month:
            where_clauses.append("month = ?")
            params.append(month)
        
        if year:
            where_clauses.append("year = ?")
            params.append(year)
        
        where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"
        
        # Get all unique students
        cur.execute(f"""
            SELECT DISTINCT student_name 
            FROM taps 
            WHERE {where_sql}
        """, params)
        
        student_names = [row[0] for row in cur.fetchall()]
        conn.close()
        
        # Get tap data for each student
        result = {}
        for name in student_names:
            result[name] = self.get_taps_for_student(name, month, year)
        
        return result
    
    def clear_taps(
        self, 
        student_name: Optional[str] = None,
        month: Optional[str] = None,
        year: Optional[int] = None
    ):
        """
        Clear tap records (use with caution!)
        
        Args:
            student_name: Optional - clear only for this student
            month: Optional - clear only for this month
            year: Optional - clear only for this year
        """
        conn = sqlite3.connect(self.db_path)
        cur = conn.cursor()
        
        where_clauses = []
        params = []
        
        if student_name:
            where_clauses.append("student_name = ?")
            params.append(student_name)
        
        if month:
            where_clauses.append("month = ?")
            params.append(month)
        
        if year:
            where_clauses.append("year = ?")
            params.append(year)
        
        if where_clauses:
            where_sql = " WHERE " + " AND ".join(where_clauses)
            cur.execute(f"DELETE FROM taps{where_sql}", params)
        else:
            cur.execute("DELETE FROM taps")
        
        conn.commit()
        conn.close()


if __name__ == '__main__':
    # Test the tap tracker
    tracker = TapTracker()
    
    # Record some sample taps
    print("Recording sample taps...")
    tracker.record_tap("Leonardo DiCaprio", "positive", "+ Prepared for Learning")
    tracker.record_tap("Leonardo DiCaprio", "positive", "+ Acting Responsibly")
    tracker.record_tap("Leonardo DiCaprio", "negative", "- Needs to work on Solving Problems")
    
    # Get student data
    data = tracker.get_taps_for_student("Leonardo DiCaprio")
    print(f"\nLeonardo DiCaprio's taps:")
    print(f"  Positive: {data['positive_taps']}")
    print(f"  Negative: {data['negative_taps']}")
    print(f"  Daily data: {data['daily_data']}")
