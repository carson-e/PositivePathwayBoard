"""
Report Generation Module
Generates student behavioral progress reports based on database data and PDF template
"""

import sqlite3
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.units import inch
from datetime import datetime
import os
from typing import Dict, List, Tuple


class ReportGenerator:
    """Generate student behavioral progress reports"""
    
    def __init__(self, db_path: str = None):
        """Initialize report generator with database connection"""
        if db_path is None:
            # Default to roster.db in the same directory as this script
            db_path = os.path.join(os.path.dirname(__file__), 'roster.db')
        self.db_path = db_path
        self.conn = None
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles for reports"""
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1f4788'),
            spaceAfter=12,
            alignment=1  # Center
        )
        self.styles.add(title_style)
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#2d5aa8'),
            spaceAfter=6,
            spaceBefore=6
        )
        self.styles.add(heading_style)
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=self.styles['BodyText'],
            fontSize=11,
            alignment=4  # Justify
        )
        self.styles.add(body_style)
    
    def connect_db(self):
        """Connect to the SQLite database"""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            return True
        except sqlite3.Error as e:
            print(f"Database connection error: {e}")
            return False
    
    def close_db(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def get_all_students(self) -> List[Dict]:
        """Retrieve all students from database"""
        if not self.conn:
            self.connect_db()
        
        try:
            cur = self.conn.cursor()
            cur.execute("SELECT * FROM Sheet1")
            columns = [desc[0] for desc in cur.description]
            students = []
            
            for row in cur.fetchall():
                student_dict = dict(zip(columns, row))
                students.append(student_dict)
            
            return students
        except sqlite3.Error as e:
            print(f"Error retrieving students: {e}")
            return []
    
    def get_student_data(self, student_name: str) -> Dict:
        """Get specific student data from database"""
        if not self.conn:
            self.connect_db()
        
        try:
            cur = self.conn.cursor()
            cur.execute("SELECT * FROM Sheet1 WHERE [Student Name] = ?", (student_name,))
            row = cur.fetchone()
            
            if row:
                columns = [desc[0] for desc in cur.description]
                return dict(zip(columns, row))
            return None
        except sqlite3.Error as e:
            print(f"Error retrieving student {student_name}: {e}")
            return None
    
    def generate_report_pdf(self, student_data: Dict, behavior_data: Dict, 
                           output_path: str, month: str = None, 
                           character_equations: List[str] = None):
        """
        Generate a PDF report for a student
        
        Args:
            student_data: Dictionary with student information from database
            behavior_data: Dictionary with positive_taps, negative_taps, daily_data
            output_path: Path to save the PDF
            month: Month name (e.g., "November")
            character_equations: List of character equations for the month
        """
        
        if month is None:
            month = datetime.now().strftime("%B")
        
        if character_equations is None:
            character_equations = ["Integrity", "Respect", "Responsibility"]
        
        # Create PDF document
        doc = SimpleDocTemplate(output_path, pagesize=letter)
        story = []
        
        # Title
        title = Paragraph("Student Behavioral Progress Report", self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 0.2 * inch))
        
        # Opening greeting
        student_name = student_data.get('Student Name', 'Student')
        teacher_name = student_data.get('Teacher Name') or student_data.get('teacher_name') or 'Teacher'
        
        greeting = f"""Dear Parent/Guardian,<br/><br/>
I hope this message finds you well. I am writing to share <b>{student_name}</b>'s behavioral 
progress for the month of <b>{month}</b>. This progress has been tracked through our in-class 
Positive Pathways Board, which encourages positive behavior and decision making.<br/><br/>

This tracking has been performed through a system of positive and redirective taps based on your 
student's in-class behavior. Positive taps are given for good choices, cooperation, participation, 
and based on the applied character equations for this month which are: <b>{', '.join(character_equations)}</b>. 
Redirective taps are given for moments that require redirection or reminders.<br/><br/>

Below, you will find charts and graphs that track your student's behavior throughout the month. 
These visual summaries help us see how classroom behavior has changed throughout the month."""
        
        story.append(Paragraph(greeting, self.styles['CustomBody']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Behavior Summary Table
        story.append(Paragraph("Behavior Summary", self.styles['CustomHeading']))
        
        positive_taps = behavior_data.get('positive_taps', 0)
        negative_taps = behavior_data.get('negative_taps', 0)
        total_taps = positive_taps + negative_taps
        positive_percentage = (positive_taps / total_taps * 100) if total_taps > 0 else 0
        
        summary_data = [
            ['Metric', 'Count', 'Percentage'],
            ['Positive Taps', str(positive_taps), f'{positive_percentage:.1f}%'],
            ['Redirective Taps', str(negative_taps), f'{100 - positive_percentage:.1f}%'],
            ['Total Taps', str(total_taps), '100%']
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5aa8')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Daily breakdown if available
        if 'daily_data' in behavior_data and behavior_data['daily_data']:
            story.append(Paragraph("Daily Breakdown", self.styles['CustomHeading']))
            
            daily_records = behavior_data['daily_data']
            daily_data = [['Date', 'Positive', 'Redirective']]
            daily_data.extend(daily_records[:20])  # Show last 20 days
            
            daily_table = Table(daily_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
            daily_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2d5aa8')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            
            story.append(daily_table)
            story.append(Spacer(1, 0.2 * inch))
        
        # Closing remarks
        story.append(Spacer(1, 0.2 * inch))
        closing = f"""<b>Closing Remarks:</b><br/>
{student_name} has demonstrated {'strong positive behavior this month!' if positive_percentage >= 75 else 'room for growth in behavioral choices.' if positive_percentage < 50 else 'good progress this month.'}
Please feel free to reach out if you have any questions or concerns.<br/><br/>

Sincerely,<br/>
{teacher_name}"""
        
        story.append(Paragraph(closing, self.styles['CustomBody']))
        
        # Build PDF
        doc.build(story)
        print(f"Report generated: {output_path}")
    
    def generate_all_reports(self, output_dir: str, behavior_data_dict: Dict = None, 
                            month: str = None, character_equations: List[str] = None):
        """
        Generate reports for all students in the database
        
        Args:
            output_dir: Directory to save reports
            behavior_data_dict: Dictionary mapping student names to their behavior data
            month: Month name
            character_equations: List of character equations
        """
        
        if not self.connect_db():
            print("Failed to connect to database")
            return
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        students = self.get_all_students()
        
        if not students:
            print("No students found in database")
            self.close_db()
            return
        
        print(f"Generating reports for {len(students)} students...")
        
        for student in students:
            student_name = student.get('Student Name')
            
            if not student_name:
                continue
            
            # Get behavior data (or use sample data if not provided)
            if behavior_data_dict and student_name in behavior_data_dict:
                behavior_data = behavior_data_dict[student_name]
            else:
                # Generate sample behavior data for demonstration
                behavior_data = {
                    'positive_taps': 15,
                    'negative_taps': 5,
                    'daily_data': [
                        ['2025-11-01', '2', '0'],
                        ['2025-11-02', '1', '1'],
                        ['2025-11-03', '2', '0'],
                        ['2025-11-04', '1', '0'],
                        ['2025-11-05', '3', '1'],
                    ]
                }
            
            # Generate filename
            filename = f"{student_name.replace(' ', '_')}_report_{month or datetime.now().strftime('%B_%Y')}.pdf"
            output_path = os.path.join(output_dir, filename)
            
            try:
                self.generate_report_pdf(student, behavior_data, output_path, month, character_equations)
            except Exception as e:
                print(f"Error generating report for {student_name}: {e}")
        
        self.close_db()
        print(f"All reports generated in {output_dir}")


# Example usage
if __name__ == "__main__":
    # Initialize generator (uses backend/roster.db by default)
    generator = ReportGenerator()
    
    # Example behavior data (you would normally get this from your tracking system)
    behavior_data_dict = {
        'Leonardo DiCaprio': {
            'positive_taps': 18,
            'negative_taps': 2,
            'daily_data': [
                ['2025-11-01', '2', '0'],
                ['2025-11-02', '2', '0'],
                ['2025-11-03', '2', '1'],
                ['2025-11-04', '2', '0'],
                ['2025-11-05', '3', '1'],
            ]
        },
        'Arnold Schwarzenegger': {
            'positive_taps': 12,
            'negative_taps': 8,
            'daily_data': [
                ['2025-11-01', '1', '1'],
                ['2025-11-02', '1', '1'],
                ['2025-11-03', '1', '1'],
                ['2025-11-04', '2', '2'],
                ['2025-11-05', '2', '1'],
            ]
        },
    }
    
    character_equations = ["Integrity", "Respect", "Responsibility"]
    
    # Set output directory relative to this script
    output_dir = os.path.join(os.path.dirname(__file__), 'reports')
    
    # Generate reports for all students
    generator.generate_all_reports(
        output_dir=output_dir,
        behavior_data_dict=behavior_data_dict,
        month='November',
        character_equations=character_equations
    )
