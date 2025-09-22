
// const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

// // updated on 2025-09-16
// let authToken = "";

async function askForPicture() {
  let replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
  let authToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODEyODQ4OCwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzU4MTI4NDg4LCJleHAiOjE3NTgxMzIwODgsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.fGdb_gmNp-P4kp9BaufK60tZM4DvNy57oLvopUhKADNdEzBdfEq5D8UUOe6hxkmK4vtoKGlf4yblY5VedJD_i-FFzLRfzvYhDS2O4Yp91Yctq9IyrmYrxVfprc9bIzRm1-hRmRV2nqXYY3_DgqBopbmxCGgSg29nh67BC-F3P42O6f8NJagrlSeBYNkJ4Re5PGJoNVdDKFRh6okBmQqasd0v_siA2uhU8_btn3pKnE7XlBxF9RVpFlwZ2JsgOaVWUPyBc_ZxGqK2LWz-nh0BI-SIgyOjw1lpEciBaR6ZZb8b6_jHm7a1zHzLjmsPx7UmF6Q5HyEdkTwNge7YGit2gA";
const basePrompt = document.getElementById("prompt").value;
const modifiedPrompt = `${basePrompt} in Gaza, 2025`;


  // The JSON that model in replicate needs to work 
  let data = {
    model: "black-forest-labs/flux-schnell", 
    input: {
      prompt: modifiedPrompt,
    },
  };

// The JSON that the fetch function needs to work (including data json)
// JSON structure for fetch request
let fetchOptions = { 
  method: "POST", 
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
};


  console.log("sending to replicate:", data);
  const response = await fetch(replicateProxy, fetchOptions);
  const prediction = await response.json();
  console.log("Got back:", prediction);

  // Display image (first output item)
  if (prediction.output && prediction.output.length > 0) {
    let imgUrl = prediction.output[0];
    document.getElementById("output").innerHTML = `<img src="${imgUrl}" width="512">`;
  } else {
    document.getElementById("output").innerText = "No image generated.";
  }
}
