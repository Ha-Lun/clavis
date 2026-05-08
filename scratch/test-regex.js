const userMessageContent = `can you summarize this for me?
📎 document.pdf: https://fra.cloud.appwrite.io/v1/storage/buckets/flux-uploads/files/69fe4dd7003ac47971ce/view?project=69f6281d001e86b9861e`;

const fileMatches = userMessageContent.matchAll(/📎\s*([^:\n]+):\s*(https?:\/\/[^\s\n]+)/g);
const detectedFiles = [];
for (const match of fileMatches) {
  detectedFiles.push({ name: match[1].trim(), url: match[2].trim() });
}

console.log("Detected Files:", detectedFiles);

for (const file of detectedFiles) {
  const urlParts = file.url.split("/");
  console.log("URL parts:", urlParts);
  const fileId = urlParts[urlParts.length - 2];
  console.log("File ID:", fileId);
}
