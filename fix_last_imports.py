#!/usr/bin/env python3

import os

# Files and their corrections
fixes = {
    # Fix IconPicker paths
    "/mnt/e/LCS/b1/b1app/src/components/admin/settings/TabEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/IconPicker", "@churchapps/apphelper/dist/components/IconPicker")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/video/TabEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/IconPicker", "@churchapps/apphelper/dist/components/IconPicker")
    ],
    
    # Fix B1ShareModal path
    "/mnt/e/LCS/b1/b1app/src/components/admin/video/SermonEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/B1ShareModal", "../../../B1ShareModal")
    ],
    
    # Fix the local component imports that need index files
    "/mnt/e/LCS/b1/b1app/src/components/eventCalendar/DisplayEventModal.tsx": [
        ("from \"../notes\";", "from \"../notes/Conversations\";")
    ],
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/AuthenticatedView.tsx": [
        ("from \"../../../../../components/notes\";", "from \"../../../../../components/notes/Conversations\";")
    ],
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/LeaderEdit.tsx": [
        ("from \"../../../../../components/gallery\";", "from \"../../../../../components/gallery/GalleryModal\";")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/settings/TabEdit.tsx": [
        ("from \"../../gallery\";", "from \"../../gallery/GalleryModal\";")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/ElementEdit.tsx": [
        ("from \"../../gallery\";", "from \"../../gallery/GalleryModal\";")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/PickColors.tsx": [
        ("from \"../../gallery\";", "from \"../../gallery/GalleryModal\";")
    ]
}

def fix_file(file_path, replacements):
    """Apply replacements to a file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    for old, new in replacements:
        content = content.replace(old, new)
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed: {file_path}")
    else:
        print(f"No changes needed: {file_path}")

# Apply all fixes
for file_path, replacements in fixes.items():
    fix_file(file_path, replacements)

print("All last import fixes applied!")