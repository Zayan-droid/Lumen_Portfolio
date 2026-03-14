import os

files = ['index.html', 'platform.html', 'teachers.html', 'parents.html', 'ai.html']

for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Update Logo image
        content = content.replace('lumen-logo.jpg', 'lumen-logo.jpeg')
        
        # Inject Full Features Nav Link
        if '<li><a href="features.html">Full Features</a></li>' not in content:
            content = content.replace(
                '<li><a href="platform.html">Platform</a></li>',
                '<li><a href="features.html">Full Features</a></li>\n                <li><a href="platform.html">Platform</a></li>'
            )
            content = content.replace(
                '<li><a href="platform.html" class="active">Platform</a></li>',
                '<li><a href="features.html">Full Features</a></li>\n                <li><a href="platform.html" class="active">Platform</a></li>'
            )
            
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Updated {f}")
    except Exception as e:
        print(f"Error on {f}: {e}")
