#!/bin/sh

# Show directory structure first
echo "Directory structure:"
find . -type d ! -path "./node_modules*" ! -path "./.git*" ! -path "./.next*" ! -name ".*" | sort

echo -e "\n\nFile contents:" > output_for_llm.txt

# Process files, excluding the output file itself
find . -type f ! -path "./node_modules/*" ! -path "./.git/*" ! -path "./.next/*" ! -name ".*" ! -name "output_for_llm.txt" | while read f; do
    echo "Processing: $f"
    echo "=== $f ===" >> output_for_llm.txt
    cat "$f" >> output_for_llm.txt
    echo >> output_for_llm.txt
done

echo "Done. Check output_for_llm.txt"
