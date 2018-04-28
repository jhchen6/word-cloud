# word-cloud
hand coded word-cloud, a coding practice

### algorithm
1. prepare words
   1. split text into words, leave out too common words
   2. count words
   3. sort according to counts
2. place words. for each word
   1. initialize word position, near center
   2. detect overlap and overflow
   3. while overlap or overflow but still possible to be placed
      1. move word a step forward along a spiral
      2. detect overlap and overflow
   4. if still overlap or overflow, ignore this word

### issues
* preciser split
* common words filtering
* preciser bounding rectangle
* meaningful color
* faster overlap detecting algorithm (currently based on pixels)
