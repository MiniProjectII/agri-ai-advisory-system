const axios = require("axios");

async function searchReddit(query) {
  // Try customized Indian farming subreddits first, and fall back to global
  const subreddits = "IndiaFarmingBusiness+AgriStudentsIndia+IndianFarmers+OrganicFarming+farmingIndia+farming+agriculture";
  
  try {
    const url = `https://www.reddit.com/r/${subreddits}/search.json?q=${encodeURIComponent(query)}&restrict_sr=1&sort=relevance&limit=3`;
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'AgriAIAdvisory/1.0'
      }
    });

    const posts = res.data?.data?.children || [];
    
    if (posts.length === 0) {
      // Complete Fallback to all of Reddit
      const globalUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(query + " farming")}&sort=relevance&limit=3`;
      const globalRes = await axios.get(globalUrl, {
        headers: { 'User-Agent': 'AgriAIAdvisory/1.0' }
      });
      const globalPosts = globalRes.data?.data?.children || [];
      return extractRedditData(globalPosts);
    }

    return extractRedditData(posts);
  } catch (err) {
    console.error("Reddit Fetch Error:", err);
    return "Could not retrieve Reddit data.";
  }
}

function extractRedditData(posts) {
  if (posts.length === 0) return "No relevant discussions found on Reddit.";
  
  let formattedData = "Recent Reddit Advice:\n";
  posts.forEach((post, i) => {
    const title = post.data.title;
    const selftext = post.data.selftext ? post.data.selftext.substring(0, 200) + "..." : "";
    formattedData += `${i + 1}. ${title} - ${selftext}\n`;
  });
  
  return formattedData;
}

module.exports = searchReddit;
