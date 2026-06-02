import html
import os

# 只修复 src 目录下的文件
def fix_src_files():
    src_dir = os.path.join(os.path.dirname(__file__), 'src')
    files_to_fix = [
        'utils/navigate.ts',
        'pages/my/category-list.vue',
        'pages/my/category-group-list.vue',
        'pages/my/account-setting/account-list.vue',
        'pages/my/account-setting/account-edit.vue'
    ]
    
    fixed_count = 0
    for file_path in files_to_fix:
        full_path = os.path.join(src_dir, file_path)
        if os.path.exists(full_path):
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                decoded = html.unescape(content)
                if decoded != content:
                    with open(full_path, 'w', encoding='utf-8') as f:
                        f.write(decoded)
                    print(f'Fixed: src/{file_path}')
                    fixed_count += 1
                else:
                    print(f'OK: src/{file_path}')
            except Exception as e:
                print(f'Error processing src/{file_path}: {e}')
        else:
            print(f'Not found: src/{file_path}')
    
    print(f'\nDone! Fixed {fixed_count} files.')

if __name__ == '__main__':
    fix_src_files()
