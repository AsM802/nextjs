import os
import json
import re

def replace_in_file(filepath, old_str, new_str):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content = content.replace(old_str, new_str)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

def update_json_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = json.load(f)

    # Convert to string to perform regex replacements on keys and values
    # This is a bit hacky but necessary for partial string replacements in keys/values
    json_str = json.dumps(content)
    for old, new in replacements.items():
        json_str = json_str.replace(old, new)

    new_content = json.loads(json_str)

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(new_content, f, indent=2)

def find_package_json_files(root_dir):
    matches = []
    for root, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename == 'package.json':
                matches.append(os.path.join(root, filename))
    return matches

def main():
    root_dir = os.getcwd()
    print(f"Starting renaming process in: {root_dir}")

    # Define replacements
    replacements = {
        '@yoko/std': '@moeru/std',
        '@proj-yoko': '@proj-airi',
        '@yoko-ext': '@xsai-ext',
        '@yoko/embed': '@xsai/embed',
        '@yoko/generate-speech': '@xsai/generate-speech',
        '@yoko/generate-text': '@xsai/generate-text',
        '@yoko/generate-transcription': '@xsai/generate-transcription',
        '@yoko/model': '@xsai/model',
        '@yoko/shared': '@xsai/shared',
        '@yoko/shared-chat': '@xsai/shared-chat',
        '@yoko/stream-text': '@xsai/stream-text',
        '@yoko/tool': '@xsai/tool',
        '@yoko/utils-chat': '@xsai/utils-chat',
        'yokoschema': 'xsschema',
        '@proj-yoko/transformers-embed': '@xsai-transformers/embed', # Specific case
        '@proj-yoko/transformers-shared': '@xsai-transformers/shared', # Specific case
    }

    # Update pnpm-workspace.yaml
    pnpm_workspace_path = os.path.join(root_dir, 'pnpm-workspace.yaml')
    if os.path.exists(pnpm_workspace_path):
        with open(pnpm_workspace_path, 'r', encoding='utf-8') as f:
            content = f.read()
        new_content = content
        for old, new in replacements.items():
            # Handle catalog entries specifically for pnpm-workspace.yaml
            # Need to be careful not to replace parts of other words
            new_content = re.sub(r"'" + re.escape(old) + r"'", "'" + new + "'", new_content)
            new_content = re.sub(r"" + re.escape(old) + r"", new, new_content) # For non-quoted keys

        with open(pnpm_workspace_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {pnpm_workspace_path}")
    else:
        print(f"Warning: {pnpm_workspace_path} not found.")

    # Update package.json files
    package_json_files = find_package_json_files(root_dir)
    for filepath in package_json_files:
        try:
            update_json_file(filepath, replacements)
            print(f"Updated {filepath}")
        except Exception as e:
            print(f"Error updating {filepath}: {e}")

    print("Renaming process completed.")

if __name__ == "__main__":
    main()