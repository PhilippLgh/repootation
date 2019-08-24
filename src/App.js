import React, { Component } from 'react'
import crypto from 'crypto'
import Box from '3box'
import './App.css'
const ethUtil = require('ethereumjs-util')

const shasum = (data, alg) => {
  return crypto
    .createHash(alg || 'sha256')
    .update(data)
    .digest('hex');
}

const SEPARATOR = '::::'

const SUPPORTED_REACTIONS = ['heart', 'like', 'dislike', 'poop']

class MetamaskHelper {
  constructor(web3) {
    this.web3 = web3
  }
  async sign(data, address){
    return new Promise((resolve, reject) => {
      if (address === undefined) {

      }
      data = this.web3.fromUtf8(data)
      this.web3.personal.sign(data, address, (err, result) => {
        if (err) return reject(err)
        return resolve(result)
      });
    });
  }
}

let metamaskHelper = new MetamaskHelper(window.web3)

const spaceName = 'aGoodSpace'
const threadName = 'testThread1'
const firstModerator = '0x94ef30282bebc97226baf5bd3a94bb835fcc4bac'
const membersThread = false
class Storage {
  constructor(){

  }
  async init(){
    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];
    const ethereumProvider = window.ethereum

    const box = await Box.openBox(myAddress, ethereumProvider)

    // open space for threads
    const space = await box.openSpace(spaceName)
    const thread = await space.joinThread(threadName)
    this.thread = thread
  }
  async addPost(message){
    await this.thread.post(message)
  }
  async deletePosts(){
    const posts = this.thread.getPosts()
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      await this.thread.deletePost(post.postId)
    }
  }
  async deletePost(post){
    console.log('delete', post)
    const result = await this.thread.deletePost(post.postId)
    console.log('result', result)
  }
  async getPosts(){

  }
} 

const storage = new Storage()

const typeToEmoji = (type) => {
  const emojis = {
    heart: '❤️',
    star: '⭐',
    like: '👍',
    dislike: '👎',
    poop: '💩'
  }
  return emojis[type]
}

class Repoomoji extends Component {
  state = {
  }
  handleReaction = async () => {
    const { doc, type } = this.props
    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];
    console.log('react to content', doc)
    try {
      const hash = shasum(doc)
      const RELATION = type
      const statement = `${hash}${SEPARATOR}${RELATION}`
      const signature = await metamaskHelper.sign(statement, myAddress)
      const signedStatement = `${statement}${SEPARATOR}${signature}`
      console.log('received signature', signedStatement)
      // persist signed statement
      await storage.addPost(signedStatement)
    } catch (error) {
      console.log('error', error)
    }
  }
  render() {
    const { type, counter } = this.props
    return (
      <div style={{ display: 'inline' }}>
        <button onClick={this.handleReaction} style={{
          cursor: 'pointer'
        }}>
          {typeToEmoji(type)}
        </button>
        <span style={{
          margin: 5
        }}>{counter}</span>
      </div>
    )
  }
}

const HashPreview = (props) => <div>Digest: {shasum(props.doc)}</div>

const Reaction = (props) => {
  const {reaction} = props
  const {postId, message, timestamp} = reaction
  const parts = reaction.message.split(SEPARATOR)
  if(parts.length === 1){
    return <div onClick={() => storage.deletePost(reaction)}>{message}</div>
  }
  const contentHash = parts[0]
  const rel = parts[1]
  const signature = parts[2]

  const msgBuffer = ethUtil.toBuffer(contentHash);
  const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
  const signatureBuffer = ethUtil.toBuffer(signature);
  const signatureParams = ethUtil.fromRpcSig(signatureBuffer)
  const { v, r, s} = signatureParams
  const publicKey = ethUtil.ecrecover(msgHash, v, r, s);
  const addressBuffer = ethUtil.publicToAddress(publicKey);
  const address = ethUtil.bufferToHex(addressBuffer);
  return (
    <div>0x{address} reacted with {typeToEmoji(rel)}</div>
  )
}

class EmojiBar extends Component {
  state = {
    reactions: [],
    reactionCounts: {}
  }
  componentWillReceiveProps(nextProps){
    const { content } = nextProps
    const hash = shasum(content)
    console.log('component will receive new props', content)
    this.fetchReactions(hash)
  }
  async componentDidMount(){
    await storage.init()
    // this.setState({ready: true})
    const { content } = this.props
    const hash = shasum(content)
    this.fetchReactions(hash)
  }
  fetchReactions = async contentHash => {
    // const data = await new Promise((resolve, reject) => box.onSyncDone(resolve))
    // console.log('data', data)

    let threadName = 'bla'
    if (contentHash === '43cf8caa5b7fee2656c424a4a3da040a6879950d9884bd16550fc73278a534c5'){
      threadName = 'testThread1'
    }

    const posts = await Box.getThread(spaceName, threadName, firstModerator, membersThread)
    console.log('posts for', contentHash, posts)
    // await Storage.deletePosts(thread)

    const counts = {}
    posts.forEach(p => {
      const { message } = p
      const parts = message.split(SEPARATOR)
      const type = parts[1]
      if (!counts[type]){
        counts[type] = 0
      }
      counts[type]++
    })

    this.setState({
      reactions: posts,
      reactionCounts: counts
    })

    console.log('done')
  }
  renderReactions = () => {
    const { reactions } = this.state
    return (
      reactions.map(reaction => <Reaction reaction={reaction} key={reaction.postId}/>)
    )
  }
  render() {
    const { content } = this.props
    const { reactionCounts } = this.state
    const showSingleReactions = true
    return (
      <div>
        {
          SUPPORTED_REACTIONS.map(r => <Repoomoji type={r} doc={content} counter={reactionCounts[r] || 0} />)
        }
       {showSingleReactions && <h2>Reactions</h2>}
       {showSingleReactions && this.renderReactions()}
      </div>
    )
  }
}


export default class App extends Component {
  state = {
    doc: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus fugiat ullam nemo a illum expedita facilis, quisquam non similique et vel architecto quasi optio assumenda odio modi, reprehenderit aliquid officia.',
    ready: false,
    reactions: [],
    reactionCounts: {}
  }
  componentDidMount = async () => {

  }
  handleChange = (event) => {
    this.setState({doc: event.target.value})
  }
  render() {
    const { doc, ready, reactionCounts } = this.state
    return (
    <div className="App">
      <h1>re\u1F4A9tation</h1>
      <h2>🔈 /rɛpjʊˈteɪʃ(ə)n/</h2>
      <div>
        ready: {ready ? 'true' : 'false'}
      </div>
      <textarea name="" id="doc" cols="100" rows="10" onChange={this.handleChange} value={doc} />
      <div>
        <HashPreview doc={doc}/>
        <EmojiBar content={doc}/>
      </div>
    </div>
    )
  }
}

