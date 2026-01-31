import * as v2 from "firebase-functions/v2";
import { google } from "googleapis";
import express, { Request, Response } from "express";
import cors from "cors";
import textToSpeech from "@google-cloud/text-to-speech";

const app = express();
const ttsClient = new textToSpeech.TextToSpeechClient();

// Standard Middleware
app.use(cors({ origin: true })); // Allow React to call this
app.use(express.json());

app.post("/tts", async (req: Request, res: Response) => {
  const {
    text,
    languageCode = "en-US",
    voiceName,
    ssmlGender,
    speakingRate,
    pitch,
    audioEncoding = "MP3",
  } = req.body || {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      message: "Missing or invalid 'text' in request body.",
    });
  }

  try {
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender,
      },
      audioConfig: {
        audioEncoding,
        speakingRate,
        pitch,
      },
    });

    const audioContent = response.audioContent;
    if (!audioContent) {
      return res.status(500).json({ message: "No audio content returned." });
    }

    const audioBase64 =
      typeof audioContent === "string"
        ? audioContent
        : Buffer.from(audioContent as Uint8Array).toString("base64");

    return res.status(200).json({
      audioContent: audioBase64,
      audioEncoding,
    });
  } catch (error: any) {
    console.error("TTS API Error:", error);
    return res.status(error.code || 500).json({
      message: "Failed to synthesize speech",
      error: error.message,
    });
  }
});

app.get("/youtube/playlists", async (req: Request, res: Response) => {
  // 1. Extract the token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send("Missing Access Token");
  }

  const accessToken = authHeader.split("Bearer ")[1];
  const includeVideos = req.query.includeVideos === "true";

  // 2. Setup the YouTube Client
  // Similar to setting up an HttpClient with a Bearer token in .NET
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const youtube = google.youtube({
    version: "v3",
    auth: oauth2Client,
  });

  try {
    // 3. Call YouTube API
    // 'mine: true' fetches playlists of the authenticated user
    const response = await youtube.playlists.list({
      part: ["snippet", "contentDetails"],
      mine: true,
      maxResults: 50,
    });

    if (!includeVideos) {
      return res.status(200).json(response.data.items);
    }

    const playlists = response.data.items || [];
    const playlistsWithVideos = await Promise.all(
      playlists.map(async (playlist) => {
        if (!playlist.id) {
          return { ...playlist, videos: [] };
        }

        const items = await youtube.playlistItems.list({
          part: ["snippet", "contentDetails"],
          playlistId: playlist.id,
          maxResults: 50,
        });

        const videos = (items.data.items || []).map((item) => ({
          videoId: item.contentDetails?.videoId,
          title: item.snippet?.title,
          thumbnail:
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url,
        }));

        return { ...playlist, videos };
      })
    );

    return res.status(200).json(playlistsWithVideos);
  } catch (error: any) {
    console.error("YouTube API Error:", error);
    return res.status(error.code || 500).json({
      message: "Failed to fetch playlists",
      error: error.message,
    });
  }
});

app.get(
  "/youtube/playlist/:id/videos",
  async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Missing Access Token");
    }

    const accessToken = authHeader.split("Bearer ")[1];
    const playlistId = req.params.id;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    try {
      const response = await youtube.playlistItems.list({
        part: ["snippet", "contentDetails"],
        playlistId,
        maxResults: 50,
        pageToken:
          typeof req.query.pageToken === "string"
            ? req.query.pageToken
            : undefined,
      });

      const videos = (response.data.items || []).map((item) => ({
        videoId: item.contentDetails?.videoId,
        title: item.snippet?.title,
        thumbnail:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url,
      }));

      return res.status(200).json({
        videos,
        nextPageToken: response.data.nextPageToken,
      });
    } catch (error: any) {
      console.error("YouTube API Error:", error);
      return res.status(error.code || 500).json({
        message: "Failed to fetch playlist videos",
        error: error.message,
      });
    }
  }
);

// Export as 'api' - your URL will end in /api/youtube/playlists
export const api = v2.https.onRequest(app);
