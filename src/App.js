import React, { Component } from 'react'
import crypto from 'crypto'
import Box from '3box'
import './App.css'
const ethUtil = require('ethereumjs-util')

window.box = Box

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

const spaceName = 'repootation'
const threadAddress = '/orbitdb/zdpuB2LPhjwYjDWaCQvBkXuLorUTACQVdh8wxWMYopcw61DyY/3box.thread.repootation.'
class Storage {
  constructor(){

  }
  async init(){
    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];
    const ethereumProvider = window.ethereum

    const box = await Box.openBox(myAddress, ethereumProvider)
    this.box = box
  }
  async getThread(threadName){
    // open space for threads
    const space = await this.box.openSpace(spaceName)
    // const thread = await space.joinThread(threadName)
    const thread = await space.joinThreadByAddress(threadAddress+threadName)
    return thread
  }
  async addPost(message, thread){
    return thread.post(message)
  }
  async deletePosts(){
    const posts = this.thread.getPosts()
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      await this.thread.deletePost(post.postId)
    }
  }
  async deletePost(post, thread){
    const result = await thread.deletePost(post.postId)
    console.log('result', result)
  }
  async getPosts(thread){
    return thread.getPosts()
  }
} 

const storage = new Storage()

const persistReaction = async (contentHash, reaction) => { 
  const thread = await storage.getThread(contentHash)
  const result = await storage.addPost(reaction, thread)
  console.log('save reaction to thread', result)
}

const recoverAddress = (message, signature) => {
  const msgBuffer = ethUtil.toBuffer(message);
  const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
  const signatureBuffer = ethUtil.toBuffer(signature);
  const signatureParams = ethUtil.fromRpcSig(signatureBuffer)
  const { v, r, s} = signatureParams
  const publicKey = ethUtil.ecrecover(msgHash, v, r, s);
  const addressBuffer = ethUtil.publicToAddress(publicKey);
  const address = ethUtil.bufferToHex(addressBuffer);
  return address
}

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
    try {
      const hash = shasum(doc)
      const RELATION = type
      const statement = `${hash}${SEPARATOR}${RELATION}`
      const signature = await metamaskHelper.sign(statement, myAddress)
      const signedStatement = `${statement}${SEPARATOR}${signature}`
      console.log('received signature', signedStatement)
      // persist signed statement
      // await storage.addPost(signedStatement)
      await persistReaction(hash, signedStatement)
      this.props.onSuccess()
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
  const parts = message.split(SEPARATOR)
  const contentHash = parts[0]
  const rel = parts[1]
  const signature = parts[2]
  /*
  if(parts.length === 1){
    return <div onClick={() => storage.deletePost(reaction)}>{message}</div>
  }
  */
  const address = recoverAddress(`${contentHash}${SEPARATOR}${rel}`, signature)
  return (
    <div onClick={async () => {
      const thread = await storage.getThread(contentHash)
      storage.deletePost(reaction, thread)}
    }>{address} reacted with {typeToEmoji(rel)} - valid: {reaction.hasPenalty ? '❌' : '✅'}</div>
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
    this.fetchReactions(hash)
  }
  async componentDidMount(){    
    // this.setState({ready: true})
    this.reload()
  }
  fetchReactions = async contentHash => {
    console.log('fetch reactions')
    // const data = await new Promise((resolve, reject) => box.onSyncDone(resolve))
    // console.log('data', data)
    let posts = []
    if(contentHash){
      await storage.init()
      const thread = await storage.getThread(contentHash)
      // enable realtime updates -> no way to unsubscribe?
      thread.onUpdate((update) => {
        // console.log('received update', update)
        this.reload()
      })
      posts = await storage.getPosts(thread)
    }

    console.log('posts for', contentHash, posts)
    // await Storage.deletePosts(thread)

    // prevent voter from multiple votes
    let voters = {}

    let score = 0
    const counts = {}
    posts.forEach(p => {
      const { message } = p
      const parts = message.split(SEPARATOR)
      const type = parts[1]
      const signature = parts[2]
      const address = recoverAddress(`${contentHash}${SEPARATOR}${type}`, signature)

      // init counter
      if (!counts[type]){
        counts[type] = 0
      }

      if(!voters[address]){
        voters[address] = true
        switch(type){
          case 'heart': score+=2; break;
          case 'like': score+=1; break;
          case 'dislike': score-=1; break;
          case 'poop': score-=2; break;
        }
        counts[type]++
      }else{
        p.hasPenalty = true
      }
    })

    this.setState({
      reactions: posts,
      reactionCounts: counts,
      score
    })

    console.log('done')
  }
  renderReactions = () => {
    const { reactions } = this.state
    return (
      reactions.map(reaction => <Reaction reaction={reaction} key={reaction.postId}/>)
    )
  }
  reload = () => {
    console.log('try to reload')
    const { content } = this.props
    const contentHash = shasum(content)
    this.fetchReactions(contentHash)
  }
  render() {
    const { content } = this.props
    const { reactionCounts, score } = this.state
    const showSingleReactions = true
    return (
      <div>
        {
          SUPPORTED_REACTIONS.map(r => <Repoomoji type={r} onSuccess={this.reload} doc={content} counter={reactionCounts[r] || 0} />)
        }
       <div>Score: {score}</div>
       {showSingleReactions && <h2>Reactions</h2>}
       {showSingleReactions && this.renderReactions()}
      </div>
    )
  }
}


export default class App extends Component {
  state = {
    doc2: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus fugiat ullam nemo a illum expedita facilis, quisquam non similique et vel architecto quasi optio assumenda odio modi, reprehenderit aliquid officia.',
    doc: `
    pragma solidity ^0.5.0;

    /**
     * @dev Standard math utilities missing in the Solidity language.
     */
    library Math {
        /**
         * @dev Returns the largest of two numbers.
         */
        function max(uint256 a, uint256 b) internal pure returns (uint256) {
            return a >= b ? a : b;
        }

        /**
         * @dev Returns the smallest of two numbers.
         */
        function min(uint256 a, uint256 b) internal pure returns (uint256) {
            return a < b ? a : b;
        }

        /**
         * @dev Returns the average of two numbers. The result is rounded towards
         * zero.
         */
        function average(uint256 a, uint256 b) internal pure returns (uint256) {
            // (a + b) / 2 can overflow, so we distribute
            return (a / 2) + (b / 2) + ((a % 2 + b % 2) / 2);
        }
    }
    `,
    ready: false,
    userAddress: ''
  }
  componentDidMount = async () => {
    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];
    this.setState({
      userAddress: myAddress
    })
  }
  handleChange = (event) => {
    this.setState({doc: event.target.value})
  }
  render() {
    const { doc, ready, userAddress } = this.state
    let title = true
    return (
    <div className="App">
      <h1>re<span style={{color: 'red'}}>\u1F4A9</span>tation</h1>
      <h2>🔈 /rɛpjʊˈteɪʃ(ə)n/</h2>
      <h4>
      {title && '"A concept which can arguably be considered to be a mirror image of currency is a reputation system."'}
      </h4>
      <div>
        User: { userAddress }
      </div>
      <textarea name="" id="doc" cols="100" rows="30" onChange={this.handleChange} value={doc} />
      <div>
        <HashPreview doc={doc}/>
        <EmojiBar content={doc}/>
      </div>
      <div>
        <h3>Outlook / Desired Properties / Rules</h3>
        <ol style={{
          textAlign: 'left'
        }}>
          <li>Multiple votes by one account are not allowed ✅</li>
          <li>One identity = one account (anti sybil attacks) ❌ - not (yet) without central server that validates identity :( </li>
          <li>Non repudiation: bad actors cannot revert or obscure their actions ✅</li>
        </ol>
      </div>
    </div>
    )
  }
}

