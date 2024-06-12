
import { startOnboardingSession, finishOnboardingSession } from './session'

// Lets put all the variables needed for all modules in the global scope
const localServerUrl= import.meta.env.VITE_LOCAL_SERVER_URL;

let incode;
let session;
const container = document.getElementById("camera-container");

function showError(e=null) {
  container.innerHTML = "<h1>There was an error</h1>";
  console.log(e.message)
}

function renderRedirectToMobile(){
  if (incode.isDesktop()) {
    incode.renderRedirectToMobile(container, {
      onSuccess: () => {
        showFinishScreen();
      },
      session: session,
      url: `${localServerUrl}?uniqueId=${session.uniqueId}`,
      // showSms: false, //uncomment if you want to remove the SMS feature
    });
  } else {
    saveDeviceData();
    showUserConsent();
  }
}

function saveDeviceData() {
  incode.sendGeolocation({ token: session.token });
  incode.sendFingerprint({ token: session.token });
}

function showUserConsent(){
  incode.renderUserConsent(container, {
    session: session,
    onSuccess: captureIdFrontSide,
  });
}

function captureIdFrontSide() {
  incode.renderCamera("front", container, {
    onSuccess: captureIdBackSide,
    onError: showError,
    token: session,
    numberOfTries: -1,
    noWait: true
  });
}

function captureIdBackSide() {
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
  captureSelfie();
}

function captureSelfie() {
  incode.renderCamera("selfie", container, {
    onSuccess: finishOnboarding,
    onError: showError,
    token: session,
    numberOfTries: -1,
    noWait: true
  });
}

function finishOnboarding() {
  // Finishing the session works along with the configuration in the flow
  // webhooks and business rules are ran here.
  const response = finishOnboardingSession(session.token);
  showFinishScreen();
}

function showFinishScreen(){
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
