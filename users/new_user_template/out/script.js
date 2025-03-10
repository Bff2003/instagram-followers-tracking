const username = "new_user_template";

let followers = [];
let followings = [];
let dontFollowMeBack = [];
let iDontFollowBack = [];
let mutuals = [];

(async () => {
  try {
    console.log(`Process started! Give it a couple of seconds`);

    const userQueryRes = await fetch(
      `https://www.instagram.com/web/search/topsearch/?query=${username}`
    );
    const userQueryJson = await userQueryRes.json();
    const userId = userQueryJson.users.find(u => u.user.username === username)?.user.pk;

    if (!userId) throw new Error("User not found");

    let after = null;
    let has_next = true;

    while (has_next) {
      const res = await fetch(`https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=` +
        encodeURIComponent(JSON.stringify({ id: userId, include_reel: true, fetch_mutual: true, first: 50, after })));
      const data = await res.json();

      has_next = data.data.user.edge_followed_by.page_info.has_next_page;
      after = data.data.user.edge_followed_by.page_info.end_cursor;
      followers = followers.concat(
        data.data.user.edge_followed_by.edges.map(({ node }) => ({
          username: node.username,
          full_name: node.full_name,
        }))
      );
    }

    after = null;
    has_next = true;

    while (has_next) {
      const res = await fetch(`https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=` +
        encodeURIComponent(JSON.stringify({ id: userId, include_reel: true, fetch_mutual: true, first: 50, after })));
      const data = await res.json();

      has_next = data.data.user.edge_follow.page_info.has_next_page;
      after = data.data.user.edge_follow.page_info.end_cursor;
      followings = followings.concat(
        data.data.user.edge_follow.edges.map(({ node }) => ({
          username: node.username,
          full_name: node.full_name,
        }))
      );
    }

    dontFollowMeBack = followings.filter(following => 
      !followers.some(follower => follower.username === following.username)
    );
    iDontFollowBack = followers.filter(follower => 
      !followings.some(following => following.username === follower.username)
    );
    
    mutuals = followers.filter(follower => 
      followings.some(following => following.username === follower.username)
    );

    const result = {
      followers,
      followings,
      dontFollowMeBack,
      iDontFollowBack,
      mutuals
    };

    function downloadJSON(filename, data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    downloadJSON("instagram_data.json", result);

    console.log("Download completed!");
  } catch (err) {
    console.error("Error:", err);
  }
})();
