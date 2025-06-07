"use client";

import { ApiHelper, ErrorMessages } from "@churchapps/apphelper";
import { Button, TextField, Typography } from "@mui/material";
import { useState } from "react";

export default function SocialSuggestions() {
  const [url, setUrl] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const getYouTubeKey = (youtubeInput: string) => {
    let result = youtubeInput.split("&")[0];
    result = result
      .replace("https://www.youtube.com/watch?v=", "")
      .replace("https://youtube.com/watch?v=", "")
      .replace("https://youtu.be/", "")
      .replace("https://www.youtube.com/embed/", "")
      .replace("https://studio.youtube.com/video/", "")
      .replace("/edit", "");
    return result;
  };

  const handleFetchPosts = () => {
    setLoading(true);
    ApiHelper.get("/sermons/socialSuggestions?youtubeVideoId=" + getYouTubeKey(url), "ContentApi")
      .then((data: any) => {
        if (data.error === null) {
          setErrors([]);
          setPosts(data.posts);
        } else if (data.error.includes("Could not load subtitles for this video. Though here are some general post ideas for you to use.")) {
          setErrors([data.error]);
          setPosts(data.posts);
        } else {
          setErrors([data.error]);
          setPosts([]);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <ErrorMessages errors={errors} />
      <div style={{ margin: 20 }}>
        <TextField
          label="YouTube URL"
          helperText="Enter YouTube URL"
          size="small"
          onChange={(e) => {setUrl(e.target.value);}}
          value={url}
        />
        <Typography>videoId: {getYouTubeKey(url)}</Typography>
        <br />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchPosts}
          disabled={loading || !url || url === ""}
        >
          {loading ? "Loading.." : "Fetch Posts"}
        </Button>
      </div>
      <div style={{ margin: 20 }}>
        {posts?.map((post: any) => (
          <div style={{ padding: 20 }}>{JSON.stringify(post)}</div>
        ))}
      </div>
    </>
  );
}
