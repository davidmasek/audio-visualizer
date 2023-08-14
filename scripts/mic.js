function startRecording(audioCtx, analyser) {
  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }
  
  // Some browsers partially implement mediaDevices. We can't assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      const getUserMedia =
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;
  
      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error("getUserMedia is not implemented in this browser")
        );
      }
  
      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  if (navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia supported.");
    const constraints = { audio: true };
    const src = navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function (stream) {
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        return source;
      })
      .catch(function (err) {
        console.log("The following gUM error occured: " + err);
      });
    return src;
  } else {
    console.log("getUserMedia not supported on your browser!");
  }
  return null;
}
