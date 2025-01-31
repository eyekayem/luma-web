async function generateImage(prompt) {
  console.log(`🔹 Requesting Image Generation: ${prompt}`);

  // Step 1: Submit job
  const response = await fetch(IMAGE_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();
  console.log("🔍 Luma API Response:", data); // 🔴 Add this line to log the full response

  if (!response.ok) throw new Error(`Luma API Error: ${JSON.stringify(data)}`);

  const jobId = data.job_id;
  if (!jobId) throw new Error("No job ID received from Luma AI");

  console.log(`✅ Image Job Submitted: ${jobId}`);
  return jobId;
}
