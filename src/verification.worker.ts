// See https://github.com/timarney/react-app-rewired/issues/362 for
// explanation on next line:
/* eslint no-restricted-globals: 0 */

/// <reference lib="webworker" />

import * as juvenalLib from 'juvenal-lib'
import { VerificationData } from './VerificationData';

export class VerificationSuccess {
  readonly kind: string = "VerificationSuccess"
}
/**
 * Command line Verification recorder, which prints output to
 * stdout and records if there was any failure.
 */
export class ReactRecorder implements juvenalLib.VRecorder {
  hasFailures: boolean;

  constructor() { 
      this.hasFailures = false
  }
  
  record(
      status: boolean,
      context: string[],
      name: string,
      title: string
  ) {
      this.hasFailures = this.hasFailures || !status
      const newTitle = context.join(" > ") + " | " + name + ": " + title
      console.log(`worker: sending verification with status=${status}, title=${newTitle}`)
      self.postMessage(new VerificationData(status, newTitle))
  }
}

// Respond to message from parent thread
self.addEventListener("message", (event) => {
    console.log("worker: received = " + event.data)
    const recorder = new ReactRecorder()
    const errorFunction = (error: Error) => {
      console.log(`worker: error = ${error.message}`)
      self.postMessage(new VerificationData(false, `Error ${error.message}`))
    }

    juvenalLib.verifyElectionRecord(
      event.data,
      errorFunction,
      recorder
    )

    console.log("worker: finished! sending success")
    self.postMessage(new VerificationSuccess())
})

// Necessary to tell typescript that this worker file is a module even though
// it may not have any explicit imports or exports
export {}

// Override the module declaration to tell Typescript that when imported, this
// is what the imported types will look like.
declare module './verification.worker' {
  export default class VerificationWorker extends Worker {
    constructor()
  }
}