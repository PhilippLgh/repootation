import React, { Component } from 'react'
import crypto from 'crypto'

const shasum = (data, alg) => {
  return crypto
    .createHash(alg || 'sha256')
    .update(data)
    .digest('hex');
}
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
        console.log('signature result', result)
        return resolve(result)
      });
    });
  }
}

let metamaskHelper = new MetamaskHelper(window.web3)

class Repoomoji extends Component {
  state = {
    counter: 0
  }
  handleReaction = async () => {
    let { counter } = this.state
    const { doc } = this.props

    counter++
    this.setState({ counter })

    const addresses = await window.ethereum.enable();
    const myAddress = addresses[0];

    const hash = shasum(doc)

    try {
      const statement = `${hash}::${myAddress}`
      const signature = await metamaskHelper.sign(statement, myAddress)
      console.log('received signature', signature)

      // persist statement

    } catch (error) {
      console.log('error', error)
    }

  }
  typeToEmoji = (type) => {
    const emojis = {
      heart: '❤️',
      star: '⭐',
      like: '👍',
      dislike: '👎',
      poop: '💩'
    }
    return emojis[type]
  }
  render() {
    const { type } = this.props
    const { counter } = this.state
    return (
      <div style={{ display: 'inline' }}>
        <button onClick={this.handleReaction}>
          {this.typeToEmoji(type)}
        </button>
        <span>{counter}</span>
      </div>
    )
  }
}

const HashPreview = (props) => <div>Digest: {shasum(props.doc)}</div>

export default class App extends Component {
  state = {
    doc: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatibus fugiat ullam nemo a illum expedita facilis, quisquam non similique et vel architecto quasi optio assumenda odio modi, reprehenderit aliquid officia.'
  }
  handleChange = (event) => {
    this.setState({doc: event.target.value})
  }
  render() {
    const { doc } = this.state
    return (
    <div className="App">
      <h1>re💩tation [ /rɛpjʊˈteɪʃ(ə)n/ ]</h1>
      <textarea name="" id="doc" cols="100" rows="10" onChange={this.handleChange}>
        {doc}
      </textarea>
      <div>
        <HashPreview doc={doc}/>
        <Repoomoji type="star" doc={doc} />
        <Repoomoji type="like" doc={doc} />
        <Repoomoji type="dislike" doc={doc}/>
        <Repoomoji type="heart" doc={doc}/>
        <Repoomoji type="poop" doc={doc}/>
      </div>
    </div>
    )
  }
}

