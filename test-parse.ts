const u = "//duckduckgo.com/l/?uddg=https%3A%2F%2Fnews.google.com%2Ftopics%2FCAAqJAgKIh5DQkFTRUFvSEwyMHZNRzFyZWhJRlpXNHRSMElvQUFQAQ&rut=5f024d61295a321c71f4194d6005bcbca2d13fd1a17e2dc778dc7b6b1b4bb954";

try {
  const urlObj = new URL(u.startsWith('//') ? `https:${u}` : u);
  console.log("urlObj:", urlObj);
  const uddg = urlObj.searchParams.get('uddg');
  console.log("uddg:", uddg);
  if (uddg) console.log(decodeURIComponent(uddg));
} catch (e) {
  console.error("error:", e);
}
