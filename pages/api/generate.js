const { LumaAI } = require('lumaai');

const client = new LumaAI({
  authToken: process.env.LUMA_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { firstImagePrompt, lastImagePrompt, videoPrompt } = req.body;

  if (!firstImagePrompt || !lastImagePrompt || !videoPrompt) {
    return res.status(400).json({ error: 'Missing one or more required prompts' });
  }

  try {
    // Generate the first image
    let firstImageGeneration = await client.generations.image.create({
      prompt: firstImagePrompt,
    });

    // Polling for the first image to be ready
    while (firstImageGeneration.state !== 'completed') {
      if (firstImageGeneration.state === 'failed') {
        throw new Error(`First image generation failed: ${firstImageGeneration.failure_reason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      firstImageGeneration = await client.generations.get(firstImageGeneration.id);
    }

    const firstImageUrl = firstImageGeneration.assets.image;

    // Generate the last image
    let lastImageGeneration = await client.generations.image.create({
      prompt: lastImagePrompt,
    });

    // Polling for the last image to be ready
    while (lastImageGeneration.state !== 'completed') {
      if (lastImageGeneration.state === 'failed') {
        throw new Error(`Last image generation failed: ${lastImageGeneration.failure_reason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
      lastImageGeneration = await client.generations.get(lastImageGeneration.id);
    }

    const lastImageUrl = lastImageGeneration.assets.image;

    // Generate the video
    let videoGeneration = await client.generations.create({
      prompt: videoPrompt,
      keyframes: {
        frame0: {
          type: 'image',
          url: firstImageUrl,
        },
        frame1: {
          type: 'image',
          url: lastImageUrl,
        },
      },
    });

    // Polling for the video to be ready
    while (videoGeneration.state !== 'completed') {
      if (videoGeneration.state === 'failed') {
        throw new Error(`Video generation failed: ${videoGeneration.failure_reason}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
      videoGeneration = await client.generations.get(videoGeneration.id);
    }

    const videoUrl = videoGeneration.assets.video;

    res.status(200).json({
      firstImage: firstImageUrl,
      lastImage: lastImageUrl,
      video: videoUrl,
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Luma Labs API request failed', details: error.message });
  }
}
