import html
import os

# 递归查找所有可能需要修复的文件
def find_files(directory, extensions):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if any(file.endswith(ext) for ext in extensions):
                yield os.path.join(root, file)

# 修复文件
def fix_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        decoded = html.unescape(content)
        if decoded != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(decoded)
            return True
        return False
    except Exception as e:
        print(f'Error processing {file_path}: {e}')
        return False

# 主函数
if __name__ == '__main__':
    base_dir = os.path.dirname(__file__)
    extensions = ['.vue', '.ts', '.tsx', '.js', '.jsx']
    
    print('Scanning for files to fix...')
    fixed_count = 0
    for file_path in find_files(base_dir, extensions):
        if fix_file(file_path):
            print(f'Fixed: {os.path.relpath(file_path, base_dir)}')
            fixed_count += 1
    
    print(f'\nDone! Fixed {fixed_count} files.')
