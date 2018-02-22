import ReactDOM from 'react-dom';
import React from 'react';
import Tags from 'react-tag-autocomplete';
let filterTags = [{id: 'bitcoin', name:'Bitcoin'}, { id: 'litecoin', name: 'Litecoin' }];
let badgeCurrency = 'bitcoin';
class App extends React.Component {
  constructor(props) {
    super(props);

    chrome.storage.sync.get("filterTags", function(items) {
      if (!chrome.runtime.error) {
        filterTags=items.filterTags;
      }
    });

    chrome.storage.sync.get("badgeCurrency", function(items) {
      if (!chrome.runtime.error) {
        if (typeof items.badgeCurrency == "undefined") {
          badgeCurrency='bitcoin';
        }
        else {badgeCurrency=items.badgeCurrency;}
      }
    });

    this.state = {
      isLoading: true,
      tickers: [],
      tags: filterTags,
      suggestions: [],
      showDonate: false,
      showSettings: false,
      badgeCurrencyState: badgeCurrency
    }
    this.handleDonateToggleClick = this.handleDonateToggleClick.bind(this);
    this.handleSettingsToggleClick = this.handleSettingsToggleClick.bind(this);
    this.handleBadgeChange = this.handleBadgeChange.bind(this);
  }

  handleDonateToggleClick() {
    this.setState(prevState => ({
      showDonate: !prevState.showDonate
    }));
  }

  handleSettingsToggleClick() {
    this.setState(prevState => ({
      showSettings: !prevState.showSettings
    }));
  }

  setCoinFilterChrome(tags){
    chrome.storage.sync.set({ "filterTags" : tags }, function() {
      if (chrome.runtime.error) {
        console.log("Runtime error.");
      }
    });
  }

  handleDelete (i) {
    const tags = this.state.tags.slice(0)
    tags.splice(i, 1)
    this.setState({ tags })
    this.setCoinFilterChrome(tags)
  }

  handleAddition (tag) {
    const tags = [].concat(this.state.tags, tag)
    this.setState({ tags })
    this.setCoinFilterChrome(tags)
  }


  handleBadgeChange(e){
    chrome.browserAction.setBadgeText({text: ''})
    badgeCurrency = e.target.value;
    this.setState({badgeCurrencyState:e.target.value});
    chrome.storage.sync.set({ "badgeCurrency" : e.target.value }, function() {
      if (chrome.runtime.error) {
        console.log("Runtime error.");
      }
    });
    timer()
  }

  componentDidMount() {
    var intervalId = setInterval(this.timer, 60000);
    // store intervalId in the state so it can be accessed later:
    this.setState({intervalId: intervalId});
    this.setState({badgeCurrencyState: badgeCurrency});
  }

  timer() {
    chrome.storage.sync.get("badgeCurrency", function(items) {
      if (!chrome.runtime.error) {
        if (typeof items.badgeCurrency == "undefined") {
          badgeCurrency='bitcoin';
        }
        else {badgeCurrency=items.badgeCurrency;}
        fetch("https://api.coinmarketcap.com/v1/ticker/"+badgeCurrency)
        .then((response) => response.json()) // Transform the data into json
        .then(data =>
          {
            var price = 0;
            var curPrice = data[0].price_usd;
            if(curPrice>1000){
              price = curPrice/1000;
              price = price.toString().substring(0,4)+'k';
            }
            else if(curPrice<1000 && curPrice>99){
              price = Math.round(curPrice);
            }
            else{
              price = curPrice.toString().substring(0,4);
            }
            chrome.browserAction.setBadgeText({text: price.toString()})
          }
        )
        .catch(error => console.log('parsing failed', error))
      }
    });
  }

  componentWillUnmount() {
    // use intervalId from the state to clear the interval
    clearInterval(this.state.intervalId);
  }

  componentWillMount() {
    chrome.storage.sync.get("filterTags", function(items) {
      if (!chrome.runtime.error) {
        if (typeof items.filterTags == "undefined") {
          filterTags=[{ id: 'bitcoin', name: 'Bitcoin' }];
        }
        else {filterTags=items.filterTags}
      }
    });
    fetch("https://api.coinmarketcap.com/v1/ticker/")
    .then((response) => response.json()) // Transform the data into json
    .then(data => this.setState({
        isLoading: false,
        tickers: data,
        suggestions: data,
        tags: filterTags
      }))
    .catch(error => console.log('parsing failed', error))
  }
  render() {
    let showCoins=[];
    var donate = null;
    var settings = null;
    this.state.tags.map(function(ticker,index){
      showCoins = [].concat(showCoins, ticker.name)
    })
    if (this.state.showDonate){
      donate =
        <div>
          <div className="tiny"> Bitcoin - 3H1agDvNjjYDgagcVAiBCPSj3eCWt5HNdJ </div>
          <div className="tiny"> Litecoin - LR1wbvhAbrSKFMgbqjhNvVJC1NCjhge6B6</div>
          <div className="tiny"> Ethereum - 0x9aF0948fE56c1f26bB70F70f88cE86cdFe4E6871 </div>
        </div>;
    }
    if (this.state.showSettings){
      settings =
        <div className="tinyLeft" id="settings">
          <label>Show Notification Badge <select defaultValue={badgeCurrency} id="badgeCurrency" onChange={this.handleBadgeChange} >
          {this.state.suggestions
          .filter(function(ticker, index) {
          return showCoins.includes(ticker.name);
          })
          .map(function(ticker, index){
            return <option value={ticker.id}>{ticker.name}</option>
          })}
          </select></label>
        </div>;
    }
    return (
      <div>
        <Tags
          tags={this.state.tags}
          suggestions={this.state.suggestions}
          handleDelete={this.handleDelete.bind(this)}
          handleAddition={this.handleAddition.bind(this)} placeholder="Add Coin Name" />
        <ul className="list">
        {this.state.suggestions
          .filter(function(ticker, index) {
          return showCoins.includes(ticker.name);
          })
          .map(function(ticker, index){
          var imgsrc = "https://files.coinmarketcap.com/static/img/coins/64x64/"+ticker.rank+".png";
          var urlsrc = "https://coinmarketcap.com/currencies/"+ticker.id;
          return  <li key={ticker.id} className="list__item">
                    <div className="list__item__left">
                      <a target="_blank" href = {urlsrc}><img className="list__item__thumbnail" src= {imgsrc} alt={ticker.name}/></a>
                    </div>
                    <div className="list__item__center">
                      <div className="list__item__title"><a target="_blank" href = {urlsrc}> {ticker.name} ({ticker.symbol})</a></div>
                      <div className="list__item__subtitle">${ticker.price_usd} | {ticker.price_btc} BTC | 1h <b className={ticker.percent_change_1h > 0?'green':'red'}>{ticker.percent_change_1h}</b> | 24h <b className={ticker.percent_change_24h > 0?'green':'red'}>{ticker.percent_change_24h}</b> | 7d <b className={ticker.percent_change_7d > 0?'green':'red'}>{ticker.percent_change_7d}</b></div>
                    </div>
                  </li>;
              })}
        </ul>
        {settings}
        <div className="tiny">Powered by <a href="https://coinmarketcap.com/api/">Coinmarketcap API</a> | <a className="donate" onClick={this.handleDonateToggleClick}>Donate</a> | <a href="https://github.com/radeesh/Cryptotick">Github</a> <img className="right" src="./imgs/settings.png" onClick={this.handleSettingsToggleClick}></img></div>
        {donate}
      </div>
    )
  }
}
var mount = document.querySelector('#app');
ReactDOM.render(<App />, mount);
