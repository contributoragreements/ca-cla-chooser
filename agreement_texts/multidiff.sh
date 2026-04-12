#!/bin/bash

# Check if at least two arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 file1 file2 [file3 ...]"
    exit 1
fi

# Reference file is the first file in the list
reference_file="$1"
shift

# Loop through each file in the list
for file in "$@"; do
    # Execute vimdiff with reference file and current file
    vimdiff -c "windo set wrap" "$reference_file" "$file"

    # Wait until vimdiff is closed before proceeding
    while pgrep -x "vimdiff" > /dev/null; do
        sleep 1
    done
done

