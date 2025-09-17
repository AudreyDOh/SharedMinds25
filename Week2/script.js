
const replicateProxy = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";

// updated on 2025-09-16
let authToken = 
"eyJhbGciOiJSUzI1NiIsImtpZCI6IjUwMDZlMjc5MTVhMTcwYWIyNmIxZWUzYjgxZDExNjU0MmYxMjRmMjAiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiQXVkcmV5IE9oIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0xvdEVlUWNJZWNfUndLQ3I4b2tiT0hoel9ERWMwcjZsVWZITHZJZlJKdGt6R3I9czk2LWMiLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vaXRwLWltYS1yZXBsaWNhdGUtcHJveHkiLCJhdWQiOiJpdHAtaW1hLXJlcGxpY2F0ZS1wcm94eSIsImF1dGhfdGltZSI6MTc1ODEyNzc4NSwidXNlcl9pZCI6Im1DRXhacVlYTFFZZHZianFwTWxCeUtYNmo5WjIiLCJzdWIiOiJtQ0V4WnFZWExRWWR2YmpxcE1sQnlLWDZqOVoyIiwiaWF0IjoxNzU4MTI3Nzg1LCJleHAiOjE3NTgxMzEzODUsImVtYWlsIjoiZG83NzJAbnl1LmVkdSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7Imdvb2dsZS5jb20iOlsiMTExNzk1Njc2Njc5MDMxNTIyNTY3Il0sImVtYWlsIjpbImRvNzcyQG55dS5lZHUiXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.GdSt8sKYTdo4kH3FNsR_Qt9loA2aJECab9qDuONqDyoeMWmS4s0EQ5g1jVDaEHGny-EW4_O1r4stlSacuY7Kylvpuyg3g-QzGHMbs3KFjqhjpM8EhwNDnlQf4plMhe3oifiMR2Z37uIkcQaYvFgOMoRfrVMYAJGc0nX2537Gv1wm1rDFwBEtTObMLGJ25A9HB3kFGE1FwQY_YEIjcR167cfjVHZ6R_048tqvI90p_Ag31YEBeN5frC6xdQxeVju_vAsYDM4D7pwDLxNERNUtQO6SzYZd4ppYN7ErGjR1iV1oB8_asZINAiWro7GKyUu97ywTYLsoeF42Y5CMOQXezg"
  document.getElementById("generateBtn").addEventListener("click", askForPicture);

async function askForPicture() {
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
      "Authorization": `Bearer ${authToken}`,
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
