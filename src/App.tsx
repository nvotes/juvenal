import React from 'react'
import './App.css'
import * as records from './records'
import VerificationWorker, { VerificationSuccess } from './verification.worker'
import * as Utils from './Utils'
import { VerificationData } from './VerificationData'

function StopButton(props: any) {
  return <button className="Stop-button" onClick={props.onClick}>Stop running verifier</button>
}

function RunButton(props: any) {
  return <button className="Run-button" onClick={props.onClick}>Verify election record</button>
}

function Verification(props: {status: boolean, title: string}) {
  let statusStr = (props.status) ? "Ok" : "Fail"
  
  return <div className={"Verification " + statusStr}>
    <div className="Status">[{statusStr}]</div>
    <div className="Title">{props.title}</div>
  </div>
}

interface AppState {
  running: boolean
  electionRecord: string
  verifications: VerificationData[]
}

class App extends React.Component<{}, AppState> {
  worker: VerificationWorker | null = null
  messagesEnd: HTMLElement | null = null
  messagesEndRef: any = React.createRef()

  constructor(props: {}) {
    super(props)
    this.stop = this.stop.bind(this)
    this.run = this.run.bind(this)
    this.onChangeTextarea = this.onChangeTextarea.bind(this)
    this.addVerification = this.addVerification.bind(this)
    this.onWorkerMessage = this.onWorkerMessage.bind(this)
    this.countVerificationErrors = this.countVerificationErrors.bind(this)
    this.state = {
      running: false,
      electionRecord: records.validRecord,
      verifications: []
    }
  }

  countVerificationErrors (): number {
    return this.state.verifications.filter(
      (verification) => !verification.status
    ).length
  }

  componentDidMount () {
    console.log("componentDidMount: scrolling into bottom")
    this.scrollToBottom()
  }

  componentDidUpdate () {
    console.log("componentDidUpdate: scrolling into bottom")
    this.scrollToBottom()
  }

  scrollToBottom = () => {
    console.log("scrolling into bottom")
    console.log(this.messagesEndRef.current)
    if (Utils.isNull(this.messagesEndRef.current)) {
      this.messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }
 
  addVerification(verification: VerificationData) {
    let verifications = this.state.verifications
    verifications.push(verification)
    this.setState({
      running: this.state.running,
      electionRecord: this.state.electionRecord,
      verifications: verifications
    })
  }

  stop() {
    console.log("stopping the web worker")
    if (this.worker !== null) {
      this.worker.terminate()
      this.worker = null
    }
    this.setRunning(false)
  }

  onWorkerMessage(event: MessageEvent) {
    console.log('parent: received message')
    if (event.data.kind === 'VerificationData') {
      const data: VerificationData = event.data
      console.log(
        `parent: received message with status=${data.status}, ` +
        `title=${data.title}`
      )
      this.addVerification(data)
      } else if (event.data.kind === 'VerificationSuccess') {
        const data: VerificationSuccess = event.data
        console.log(`parent: received verification success, data=${data}`)
        this.stop()
      }
  }

  run() {
    if (!Utils.isNull(this.worker)) {
      console.log("parent: unexpectedly a worker was still in memory")
    }
    
    // Init worker
    console.log("parent: initializing worker")
    this.worker = new VerificationWorker()
    this.worker.onmessage = this.onWorkerMessage;

    this.setState({
      running: true, 
      electionRecord: this.state.electionRecord,
      verifications: []
    })
    console.log(
      "parent: sending the election record to the worker " + 
      `with data=${this.state.electionRecord}`
    )
    
    this.worker.postMessage(this.state.electionRecord)
  }

  setRunning(running: boolean) {
    this.setState({
      running: false,
      verifications: this.state.verifications,
      electionRecord: this.state.electionRecord
    })
  }

  onChangeTextarea(event: React.ChangeEvent<HTMLTextAreaElement>) {
    console.log("setting election record to " + event.target.value)
    this.setState({
      electionRecord: event.target.value,
      running: this.state.running,
      verifications: this.state.verifications
    })
    this.scrollToBottom()
  }

  renderVerifications() {
    return <div className="Verifier-output">
      {this.state.verifications.map((verification) =>
          <Verification 
            status={verification.status}
            title={verification.title} />
      )}
      <div className="Bottom" ref={this.messagesEndRef}></div>
    </div>
  }

  renderEmpty() {
    return <div className="Verifier-output Empty">
      <h3>Mathematically verify an election</h3>
      <p>
        Juvenal allows you to verify an election record
        created with&nbsp;
          <a 
            href="https://github.com/microsoft/ElectionGuard-SDK"
            target="_blank"
            rel="noopener noreferrer"
          >
            ElectionGuard SDK
          </a>.
      </p>
    </div>
  }
  
  render() {
    let button = (this.state.running) ?
      <StopButton onClick={this.stop}></StopButton> :
      <RunButton onClick={this.run}></RunButton>

    return (
      <div className="App">
        <header className="App-header">
          <div className="App-logo">
            <div className="Name">Juvenal</div>
            <div className="Powered-by">
              (powered by &nbsp; 
              <a 
                className="App-link"
                href="https://nvotes.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                nVotes
              </a>)
            </div>
          </div>
          <div className="Open-source">
            <a 
                className="Big-button"
                href="https://github.com/nvotes/juvenal" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Fork in GitHub
              </a>
          </div>
        </header>

        <div className="Body">
          <textarea 
            className="Election-record" 
            onChange={this.onChangeTextarea}
            defaultValue={this.state.electionRecord}>
          </textarea>

          <div className="Verification-results">
            {button}
            {
              // show or hide global status reporting
              (this.state.verifications.length > 0)
                ? <div className="Global-status">
                    <span className="Description">Global Status:</span>
                    {
                      (this.countVerificationErrors() === 0)
                        ? <span className="Ok">Ok</span>
                        : <span className="Fail">Fail</span>
                    }
                    <span>({this.countVerificationErrors()} errors)</span>
                </div> 
                : <div className="Global-status"></div>
            }
            {
              // show verification list or empty home text
              (this.state.verifications.length > 0)
                ? this.renderVerifications()
                : this.renderEmpty()
            }
          </div>
        </div>
      </div>
    )
  }
}

export default App
