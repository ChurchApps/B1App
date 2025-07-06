#!/usr/bin/env python3

import os
import re

# Files and their corrections
fixes = {
    # Fix relative path issues for Conversations
    "/mnt/e/LCS/b1/b1app/src/components/eventCalendar/DisplayEventModal.tsx": [
        ("from \"../notes/Conversations\";", "from \"../notes\";"),
        ("{ Conversations }", "{ Conversations }")
    ],
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/AuthenticatedView.tsx": [
        ("from \"../../../../../components/notes/Conversations\";", "from \"../../../../../components/notes\";"),
        ("{ Conversations }", "{ Conversations }")
    ],
    
    # Fix GalleryModal relative paths - these need to check the relative path count
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/LeaderEdit.tsx": [
        ("from \"../../../../../components/gallery/GalleryModal\";", "from \"../../../../../components/gallery\";"),
        ("{ GalleryModal }", "{ GalleryModal }")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/settings/TabEdit.tsx": [
        ("from \"../../gallery/GalleryModal\";", "from \"../../gallery\";"),
        ("{ GalleryModal }", "{ GalleryModal }")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/ElementEdit.tsx": [
        ("from \"../../gallery/GalleryModal\";", "from \"../../gallery\";"),
        ("{ GalleryModal }", "{ GalleryModal }")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/PickColors.tsx": [
        ("from \"../../gallery/GalleryModal\";", "from \"../../gallery\";"),
        ("{ GalleryModal }", "{ GalleryModal }")
    ],
    
    # Fix LoginPage and SiteHeader paths
    "/mnt/e/LCS/b1/b1app/src/components/Login.tsx": [
        ("@churchapps/apphelper/dist/components/LoginPage", "@churchapps/apphelper/dist/pageComponents/LoginPage")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/AdminHeader.tsx": [
        ("@churchapps/apphelper/dist/helpers/SiteHeader", "@churchapps/apphelper/dist/components/header/SiteHeader")
    ]
}

# Remove CreatePerson import and usage
create_person_fixes = {
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/PersonAdd.tsx": [
        ("import { CreatePerson } from \"@churchapps/apphelper/dist/helpers/CreatePerson\";", "// CreatePerson component not available"),
        ("CreatePerson", "// CreatePerson")
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

for file_path, replacements in create_person_fixes.items():
    fix_file(file_path, replacements)

print("All final import fixes applied!")