import os
import re

files = ['index.html', 'features.html', 'students.html', 'teachers.html', 'parents.html', 'ai.html']

nav_template = '''            <ul class="nav__links">
                <li><a href="features.html"{features_active}>Full Features</a></li>
                <li><a href="students.html"{students_active}>For Students</a></li>
                <li><a href="teachers.html"{teachers_active}>For Teachers</a></li>
                <li><a href="parents.html"{parents_active}>For Parents</a></li>
                <li><a href="ai.html"{ai_active}>AI Features</a></li>
            </ul>'''

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
            
        # Determine which link should be active
        features_a = ' class="active"' if f == 'features.html' else ''
        students_a = ' class="active"' if f == 'students.html' else ''
        teachers_a = ' class="active"' if f == 'teachers.html' else ''
        parents_a  = ' class="active"' if f == 'parents.html' else ''
        ai_a       = ' class="active"' if f == 'ai.html' else ''
        
        replacement = nav_template.format(
            features_active=features_a,
            students_active=students_a,
            teachers_active=teachers_a,
            parents_active=parents_a,
            ai_active=ai_a
        )
        
        # Regex to find the entire ul block and replace it
        pattern = re.compile(r'<ul class="nav__links">.*?</ul>', re.DOTALL)
        content = pattern.sub(replacement, content)
            
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
            
        print(f"Unified navigation in {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")
