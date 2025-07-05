#!/usr/bin/env python3

import os
import re

# Files and their corrections
fixes = {
    # MarkdownPreviewLight corrections
    "/mnt/e/LCS/b1/b1app/src/components/groups/GroupCard.tsx": [
        ("@churchapps/apphelper/dist/helpers/MarkdownPreviewLight", "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/eventCalendar/DisplayEventModal.tsx": [
        ("@churchapps/apphelper/dist/helpers/MarkdownPreviewLight", "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight"),
        ("@churchapps/apphelper/dist/helpers/Conversations", "../notes/Conversations")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/TableEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/MarkdownPreviewLight", "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/calendar/DisplayCalendarEventModal.tsx": [
        ("@churchapps/apphelper/dist/helpers/MarkdownPreviewLight", "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight")
    ],
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/AuthenticatedView.tsx": [
        ("@churchapps/apphelper/dist/helpers/MarkdownPreviewLight", "@churchapps/apphelper/dist/components/markdownEditor/MarkdownPreviewLight"),
        ("@churchapps/apphelper/dist/helpers/Conversations", "../../../../../components/notes/Conversations")
    ],
    
    # ExportLink corrections
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/GroupSessions.tsx": [
        ("@churchapps/apphelper/dist/helpers/ExportLink", "@churchapps/apphelper/dist/components/ExportLink")
    ],
    
    # GalleryModal corrections - these should be local imports
    "/mnt/e/LCS/b1/b1app/src/app/[sdSlug]/groups/details/[groupSlug]/components/LeaderEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/GalleryModal", "../../../../../components/gallery/GalleryModal")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/settings/TabEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/GalleryModal", "../../gallery/GalleryModal")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/ElementEdit.tsx": [
        ("@churchapps/apphelper/dist/helpers/GalleryModal", "../../gallery/GalleryModal")
    ],
    "/mnt/e/LCS/b1/b1app/src/components/admin/elements/PickColors.tsx": [
        ("@churchapps/apphelper/dist/helpers/GalleryModal", "../../gallery/GalleryModal")
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

print("All import fixes applied!")