# Agreement Texts

This directory contains the generated agreement texts as of the fla-url branch, to have a point of reference also for non-coders and without running the app themselves. Shortly, these should be auto-generated by the tests.

## multidiff.sh

The directory also contains a shell script, `multidiff.sh`. It allows to diff a bunch of file based on a reference file, using vimdiff. Usage: `multidiff.sh $FILES`. Files can be manually set files or a list of file through shell globbing such as `fla-*.txt`, which would use only fla texts, and only the text versions. This makes the most sense differences will be most easily visible.
