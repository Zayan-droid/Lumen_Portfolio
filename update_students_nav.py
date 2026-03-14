import os

files = ['index.html', 'features.html', 'teachers.html', 'parents.html', 'ai.html']

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace 'Platform' link with 'For Students' linking to students.html
        if '<li><a href="platform.html">Platform</a></li>' in content:
            content = content.replace(
                '<li><a href="platform.html">Platform</a></li>',
                '<li><a href="students.html">For Students</a></li>'
            )
        # Handle the active state in features/teachers/parents/ai if it mistakenly got copied over
        if '<li><a href="platform.html" class="active">Platform</a></li>' in content:
            content = content.replace(
                '<li><a href="platform.html" class="active">Platform</a></li>',
                '<li><a href="students.html">For Students</a></li>'
            )
            
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")
