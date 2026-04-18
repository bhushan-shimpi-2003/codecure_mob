const input = '<iframe width="779" height="438" src="https://www.youtube.com/embed/QmkJlFTl2f0" title="13-03-2026" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';

let urlToProcess = input;

// Step 1: extract src from iframe
if (input.includes('<iframe') && input.includes('src=')) {
  const srcMatch = input.match(/src="([^"]+)"/);
  if (srcMatch && srcMatch[1]) {
    urlToProcess = srcMatch[1];
  }
}
console.log('Step 1 - Extracted URL:', urlToProcess);

// Step 2: extract video ID
const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?"]*).*/;
const match = urlToProcess.match(regExp);
console.log('Step 2 - Video ID:', match ? match[2] : 'NO MATCH');
console.log('Step 2 - ID length:', match ? match[2].length : 'N/A');

if (match && match[2].length === 11) {
  const finalUrl = `https://www.youtube-nocookie.com/embed/${match[2]}?rel=0&modestbranding=1`;
  console.log('Step 3 - Final URL:', finalUrl);
} else {
  console.log('FAILED - Could not extract video ID');
}
