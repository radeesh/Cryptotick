import ReactDOM from 'react-dom';
import React from 'react';
import Tags from 'react-tag-autocomplete';
let filterTags = [{id: 'bitcoin', name:'Bitcoin'}, { id: 'litecoin', name: 'Litecoin' }];
class App extends React.Component {
  constructor(props) {
    super(props);

    chrome.storage.sync.get("filterTags", function(items) {
      if (!chrome.runtime.error) {
        filterTags=items.filterTags;
      }
    });
    this.state = {
      isLoading: true,
      tickers: [],
      tags: filterTags,
      suggestions: [],
      showDonate: false
    }
    this.handleToggleClick = this.handleToggleClick.bind(this);
  }

  handleToggleClick() {
    this.setState(prevState => ({
      showDonate: !prevState.showDonate
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
    this.state.tags.map(function(ticker,index){
      showCoins = [].concat(showCoins, ticker.name)
    })
    if (this.state.showDonate){
      donate =
        <div>
          <div className="tiny"> ETH - 0x9aF0948fE56c1f26bB70F70f88cE86cdFe4E6871 </div>
          <div className="tiny"> ARK - AaQSCKxmrWhoPKkT4BfperknqrJmzQpUSH </div>
          <div className="tiny"> Litecoin - LaArBQHSHpWidbY2gVEcurSn5a2U679FQC</div>
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
          var imgsrc = "https://files.coinmarketcap.com/static/img/coins/64x64/"+ticker.id+".png";
          return  <li key={ticker.id} className="list__item">
                    <div className="list__item__left">
                      <img className="list__item__thumbnail" src= {imgsrc} alt={ticker.name}/>
                    </div>

                    <div className="list__item__center">
                      <div className="list__item__title">{ticker.name} ({ticker.symbol})</div>
                      <div className="list__item__subtitle">${ticker.price_usd} | {ticker.price_btc} BTC | 1h <b className={ticker.percent_change_1h > 0?'green':'red'}>{ticker.percent_change_1h}</b> | 24h <b className={ticker.percent_change_24h > 0?'green':'red'}>{ticker.percent_change_24h}</b> | 7d <b className={ticker.percent_change_7d > 0?'green':'red'}>{ticker.percent_change_7d}</b></div>
                    </div>
                  </li>;
              })}
        </ul>
        <div className="tiny">Powered by <a href="https://coinmarketcap.com/api/">Coinmarketcap API</a> | <a className="donate" onClick={this.handleToggleClick}>Donate</a> | <a href="https://github.com/radeesh/Cryptotick">Github</a></div>
        {donate}
      </div>
    )
  }
}
var mount = document.querySelector('#app');
ReactDOM.render(<App />, mount);
