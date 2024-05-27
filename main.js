
// Lets put all the variables needed for all modules in the global scope
const tokenServerURL= import.meta.env.VITE_TOKEN_SERVER_URL;
const localServerUrl= import.meta.env.VITE_LOCAL_SERVER_URL;

let incode;
let session;
const container = document.getElementById("camera-container");

async function startOnboardingSession() {
  const urlParams = new URLSearchParams(window.location.search);
  const uniqueId = urlParams.get('uniqueId');
  
  let sessionStartUrl = `${tokenServerURL}/start`
  if (uniqueId) sessionStartUrl +=`?uniqueId=${uniqueId}`;
  
  const response = await fetch(sessionStartUrl);
  if (!response.ok) {
    const sessionData = await response.json();
    throw new Error(sessionData.error);
  }
  
  return await response.json();
}

function showError(e=null) {
  container.innerHTML = "<h1>There was an error</h1>";
  console.log(e.message)
}

function renderRedirectToMobile(){
  if (incode.isDesktop()) {
    incode.renderRedirectToMobile(container, {
      onSuccess: () => {
        finish();
      },
      session: session,
      url: `${localServerUrl}?uniqueId=${session.uniqueId}`,
      // showSms: false, //uncomment if you want to remove the SMS feature
    });
  } else {
    renderUserConsent();
  }
}

function renderUserConsent(){
  incode.renderUserConsent(container, {
    session: session,
    onSuccess: renderFrontIDCamera,
  });
}

function renderFrontIDCamera() {
  
  // Optional but valuable for fraud prevention, hurts conversion
  // incode.sendFingerprint(session);
  // incode.sendGeolocation(session);
  
  incode.renderCamera("front", container, {
    onSuccess: renderBackIDCamera,
    onError: showError,
    token: session,
    numberOfTries: -1,
    noWait: true
  });
}

function renderBackIDCamera() {
  incode.renderCamera("back", container, {
    onSuccess: processID,
    onError: showError,
    token: session,
    numberOfTries: -1,
    noWait: true
  });
}

async function  processID() {
  const results = await incode.processId({
    token: session.token,
  });
  console.log("processId results", results);
  renderSelfieCamera();
}



function renderSelfieCamera() {
  incode.renderCamera("selfie", container, {
    onSuccess: processFace,
    onError: showError,
    token: session,
    numberOfTries: -1,
    noWait: true
  });
}

async function  processFace() {
  const results = await incode.processFace({
    token: session.token,
  });
  console.log("processFace results", results);
  finish();
}

function finish() {
  // Finishing the session works along with the configuration in the flow
  // webhooks and business rules are ran here.
  const response = incode.getFinishStatus(import.meta.env.VITE_FLOW_ID, session);
  
  const container = document.getElementById("finish-container");
  container.innerHTML = "<h1>Finished</h1>";
}

async function app() {
  try {
    // Create the instance of incode linked to a client
    const apiURL = import.meta.env.VITE_API_URL;
    incode = window.OnBoarding.create({
      apiURL: apiURL
    });
    
    // Create the single session
    container.innerHTML = "<h1>Creating session...</h1>";
    try {
      session = await startOnboardingSession();
    } catch(e) {
      showError(e);
      return;
    }
    // Empty the container and starting the flow
    container.innerHTML = "";
    renderRedirectToMobile();
  } catch (e) {
    console.dir(e);
    container.innerHTML = "<h1>Something Went Wrong</h1>";
    throw e;
  }
}

document.addEventListener("DOMContentLoaded", app);
