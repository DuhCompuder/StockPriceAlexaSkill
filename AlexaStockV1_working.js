
const Alexa = require('ask-sdk-core');
const https = require('https');
//const Quotes = require('./retrieveQuote.js');

//Develop session attribute for getting stock list then create stock price retrieval 

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Welcome to stockView, you can check prices of Standard and Poor\'s 500 stocks. For more information say help. This skill is developed for fun with a Version two being developed with full capabilities. Feel free to leave a feedback and enjoy!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const StockPriceCheckIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'GetQuoteIntent';
    },
    async handle(handlerInput) {
        /*
        //Errors and Trials
        let stockPromise = new Promise((resolve,reject) => {
            let idResponse = handlerInput.requestEnvelope.request.intent.slots['stock'].resolutions.resolutionsPerAuthority[0].values[0].value.id;
            let valueResponse = handlerInput.requestEnvelope.request.intent.slots['stock'].value;
            if (idResponse){
                console.log('idResponse')
                resolve(idResponse);
            }else{
                console.log('valueResponse')
                resolve(valueResponse);
            }
        });
        let userResponse = await stockPromise.then(() => handlerInput.requestEnvelope.request.intent.slots['stock'].value);
        */
        //const idResponse = handlerInput.requestEnvelope.request.intent.slots['stock'].resolutions.resolutionsPerAuthority[0].values[0].value.id;
        const valueResponse = handlerInput.requestEnvelope.request.intent.slots['stock'].value;
        let userResponse = valueResponse; //idResponse || 
        //this.event.request.intent.slots.songs.resolutions.resolutionsPerAuthority[0].values[0].value.id
        console.log("logging after promise " + userResponse);
        let outputSpeech = 'did you say ' + userResponse + '?';
        let repromtSpeech = 'Is there another stock you would like to check?';
        let stockPrice;
        let stockID = userResponse.toUpperCase();
        let isAStock = isItAStock(stockID); // let it equate to some function call to check whether it is a stock
        console.log(isAStock);
        if(userResponse) {
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${userResponse}&apikey=${apikey}`;
            let outString = await getRemoteData(url)
            .then((response) => {
                const data = JSON.parse(response);
                stockPrice = data["Global Quote"]["05. price"];
                //outputSpeech = `The current price of ${userResponse} is ${stockPrice}. `;
                return `${checkStockName[stockID] || userResponse} is priced at ${stockPrice}`; //change price function
            })
            .catch((err) => {
                //set an optional error message here
                console.log(err.message);
                return `Stockview was unable to retrieve information for ${userResponse}. Please make sure your stock symbol is a valid Standard and Poor's ticker symbol. `;
            });
            console.log(outString)
            outputSpeech = outString;
            return handlerInput.responseBuilder
                .speak(outputSpeech)
                .withSimpleCard('Stock View', outputSpeech)
                .addDirective({
                    type: "Alexa.Presentation.APL.RenderDocument",
                    document: require('./stockRenderAPL.json'),
                    datasources: {
                        "displayStocks": {
                            "type": "object",
                            "properties": {
                                "stockName": stockID,
                                "stockPrice": stockPrice
                                /*
                                {
                                    "type": "PagerItem",
                                    "stockName": stockID,
                                    "stockPrice": stockPrice //might modulize these to increase the number depending on the items in list
                                }, */
                            }
                        }
                    }
                })
                .reprompt(outputSpeech)
                .getResponse();
        } else {
            outputSpeech = `Is not a valid S&P 500 stock`;
            return handlerInput.responseBuilder
                .speak(outputSpeech)
                .reprompt(repromtSpeech)
                .getResponse();
        }
    },
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return (Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent');
    },
    handle(handlerInput) {
        let speakOutput = `To use the app, just say, check the price of followed by the ticker symbol of the stock.`;
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
const getRemoteData = function (url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? require('https') : require('http');
    const request = client.get(url, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Failed with status code: ' + response.statusCode));
      }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    request.on('error', (err) => reject(err))
  })
};

/* Old stock grabber
const GetStockPriceHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetStockIntent';
  },
  async handle(handlerInput) {
    const response = await httpGet();
    
    console.log(response);

    return handlerInput.responseBuilder
            .speak("Okay. Here is what I got back from my stock request. " + response["Global Quote"]["05. price"])
            .reprompt("What would you like?")
            .getResponse();
  },
};

//Support Functions

function httpGet() {
    return new Promise(((resolve, reject) => {
        const apiKey = '1VL3IWWRLAPJB5MT';
        const stockID = 'AUY';
        var options = {
            host: 'https://www.alphavantage.co',
            port: `/query?function=GLOBAL_QUOTE&symbol=${stockID}&apikey=${apiKey}`,
            path: 443,
            method: 'GET'
        };
        const request = https.request(options, (response) => {
            response.setEncoding('utf8');
            let returnData = '';

            response.on('data', (chunk) => {
                returnData += chunk;
            });
            response.on('end', (chunk) => {
                resolve(JSON.parse(returnData));
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
        request.end();
    }));
}

*/



// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        StockPriceCheckIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

function isItAStock (userAnswer) {
    if (checkStockName[userAnswer]) {
        return true;
    } else {
        return false;
    }
};

//`Did you say {userAnswer}`;
//`{stockName} is trading at {stockPrice}`;
const checkStockName = {
    'MMM': '3M Company',
    'AOS': 'A.O. Smith Corp',
    'ABT': 'Abbott Laboratories',
    'ABBV': 'AbbVie Inc.',
    'ACN': 'Accenture plc',
    'ATVI': 'Activision Blizzard',
    'AYI': 'Acuity Brands Inc',
    'ADBE': 'Adobe Systems Inc',
    'AAP': 'Advance Auto Parts',
    'AMD': 'Advanced Micro Devices Inc',
    'AES': 'AES Corp',
    'AET': 'Aetna Inc',
    'AMG': 'Affiliated Managers Group Inc',
    'AFL': 'AFLAC Inc',
    'A': 'Agilent Technologies Inc',
    'APD': 'Air Products & Chemicals Inc',
    'AKAM': 'Akamai Technologies Inc',
    'ALK': 'Alaska Air Group Inc',
    'ALB': 'Albemarle Corp',
    'ARE': 'Alexandria Real Estate Equities Inc',
    'ALXN': 'Alexion Pharmaceuticals',
    'ALGN': 'Align Technology',
    'ALLE': 'Allegion',
    'AGN': 'Allergan',
    'ADS': 'Alliance Data Systems',
    'LNT': 'Alliant Energy Corp',
    'ALL': 'Allstate Corp',
    'GOOGL': 'Alphabet Inc Class A',
    'GOOG': 'Alphabet Inc Class C',
    'MO': 'Altria Group Inc',
    'AMZN': 'Amazon.com Inc.',
    'AEE': 'Ameren Corp',
    'AAL': 'American Airlines Group',
    'AEP': 'American Electric Power',
    'AXP': 'American Express Co',
    'AIG': 'American International Group',
    'AMT': 'American Tower Corp A',
    'AWK': 'American Water Works Company Inc',
    'AMP': 'Ameriprise Financial',
    'ABC': 'AmerisourceBergen Corp',
    'AME': 'AMETEK Inc.',
    'AMGN': 'Amgen Inc.',
    'APH': 'Amphenol Corp',
    'APC': 'Anadarko Petroleum Corp',
    'ADI': 'Analog Devices',
    'ANDV': 'Andeavor',
    'ANSS': 'ANSYS',
    'ANTM': 'Anthem Inc.',
    'AON': 'Aon plc',
    'APA': 'Apache Corporation',
    'AIV': 'Apartment Investment & Management',
    'AAPL': 'Apple Inc.',
    'AMAT': 'Applied Materials Inc.',
    'APTV': 'Aptiv Plc',
    'ADM': 'Archer-Daniels-Midland Co',
    'ARNC': 'Arconic Inc.',
    'AJG': 'Arthur J. Gallagher & Co.',
    'AIZ': 'Assurant Inc.',
    'T': 'AT&T Inc.',
    'ADSK': 'Autodesk Inc.',
    'ADP': 'Automatic Data Processing',
    'AZO': 'AutoZone Inc',
    'AVB': 'AvalonBay Communities',
    'AVY': 'Avery Dennison Corp',
    'BHGE': 'Baker Hughes',
    'BLL': 'Ball Corp',
    'BAC': 'Bank of America Corp',
    'BAX': 'Baxter International Inc.',
    'BBT': 'BB&T Corporation',
    'BDX': 'Becton Dickinson',
    'BRK.B': 'Berkshire Hathaway',
    'BBY': 'Best Buy Co. Inc.',
    'BIIB': 'Biogen Inc.',
    'BLK': 'BlackRock',
    'HRB': 'Block H&R',
    'BA': 'Boeing Company',
    'BKNG': 'Booking Holdings Inc',
    'BWA': 'BorgWarner',
    'BXP': 'Boston Properties',
    'BSX': 'Boston Scientific',
    'BHF': 'Brighthouse Financial Inc',
    'BMY': 'Bristol-Myers Squibb',
    'AVGO': 'Broadcom',
    'BF.B': 'Brown-Forman Corp.',
    'CHRW': 'C. H. Robinson Worldwide',
    'CA': 'CA',
    'COG': 'Cabot Oil & Gas',
    'CDNS': 'Cadence Design Systems',
    'CPB': 'Campbell Soup',
    'COF': 'Capital One Financial',
    'CAH': 'Cardinal Health Inc.',
    'KMX': 'Carmax Inc',
    'CCL': 'Carnival Corp.',
    'CAT': 'Caterpillar Inc.',
    'CBOE': 'Cboe Global Markets',
    'CBRE': 'CBRE Group',
    'CBS': 'CBS Corp.',
    'CELG': 'Celgene Corp.',
    'CNC': 'Centene Corporation',
    'CNP': 'CenterPoint Energy',
    'CTL': 'CenturyLink Inc',
    'CERN': 'Cerner',
    'CF': 'CF Industries Holdings Inc',
    'SCHW': 'Charles Schwab Corporation',
    'CHTR': 'Charter Communications',
    'CVX': 'Chevron Corp.',
    'CMG': 'Chipotle Mexican Grill',
    'CB': 'Chubb Limited',
    'CHD': 'Church & Dwight',
    'CI': 'CIGNA Corp.',
    'XEC': 'Cimarex Energy',
    'CINF': 'Cincinnati Financial',
    'CTAS': 'Cintas Corporation',
    'CSCO': 'Cisco Systems',
    'C': 'Citigroup Inc.',
    'CFG': 'Citizens Financial Group',
    'CTXS': 'Citrix Systems',
    'CME': 'CME Group Inc.',
    'CMS': 'CMS Energy',
    'KO': 'Coca-Cola Company (The)',
    'CTSH': 'Cognizant Technology Solutions',
    'CL': 'Colgate-Palmolive',
    'CMCSA': 'Comcast Corp.',
    'CMA': 'Comerica Inc.',
    'CAG': 'Conagra Brands',
    'CXO': 'Concho Resources',
    'COP': 'ConocoPhillips',
    'ED': 'Consolidated Edison',
    'STZ': 'Constellation Brands',
    'GLW': 'Corning Inc.',
    'COST': 'Costco Wholesale Corp.',
    'COTY': '"Coty',
    'CCI': 'Crown Castle International Corp.',
    'CSRA': 'CSRA Inc.',
    'CSX': 'CSX Corp.',
    'CMI': 'Cummins Inc.',
    'CVS': 'CVS Health',
    'DHI': 'D. R. Horton',
    'DHR': 'Danaher Corp.',
    'DRI': 'Darden Restaurants',
    'DVA': 'DaVita Inc.',
    'DE': 'Deere & Co.',
    'DAL': 'Delta Air Lines Inc.',
    'XRAY': 'Dentsply Sirona',
    'DVN': 'Devon Energy Corp.',
    'DLR': 'Digital Realty Trust Inc',
    'DFS': 'Discover Financial Services',
    'DISCA': 'Discovery Inc. Class A',
    'DISCK': 'Discovery Inc. Class C',
    'DISH': 'Dish Network',
    'DG': 'Dollar General',
    'DLTR': 'Dollar Tree',
    'D': 'Dominion Energy',
    'DOV': 'Dover Corp.',
    'DWDP': 'DowDuPont',
    'DPS': 'Dr Pepper Snapple Group',
    'DTE': 'DTE Energy Co.',
    'DUK': 'Duke Energy',
    'DRE': 'Duke Realty Corp',
    'DXC': 'DXC Technology',
    'ETFC': 'E*Trade',
    'EMN': 'Eastman Chemical',
    'ETN': 'Eaton Corporation',
    'EBAY': 'eBay Inc.',
    'ECL': 'Ecolab Inc.',
    'EIX': 'Edison Int\'l',
    'EW': 'Edwards Lifesciences',
    'EA': 'Electronic Arts',
    'EMR': 'Emerson Electric Company',
    'ETR': 'Entergy Corp.',
    'EVHC': 'Envision Healthcare',
    'EOG': 'EOG Resources',
    'EQT': 'EQT Corporation',
    'EFX': 'Equifax Inc.',
    'EQIX': 'Equinix',
    'EQR': 'Equity Residential',
    'ESS': 'Essex Property Trust',
    'EL': 'Estee Lauder Cos.',
    'RE': 'Everest Re Group Ltd.',
    'ES': 'Eversource Energy',
    'EXC': 'Exelon Corp.',
    'EXPE': 'Expedia Inc.',
    'EXPD': 'Expeditors International',
    'ESRX': 'Express Scripts',
    'EXR': 'Extra Space Storage',
    'XOM': 'Exxon Mobil Corp.',
    'FFIV': 'F5 Networks',
    'FB': 'Facebook',
    'FAST': 'Fastenal Co',
    'FRT': 'Federal Realty Investment Trust',
    'FDX': 'FedEx Corporation',
    'FIS': 'Fidelity National Information Services',
    'FITB': 'Fifth Third Bancorp',
    'FE': 'FirstEnergy Corp',
    'FISV': 'Fiserv Inc',
    'FLIR': 'FLIR Systems',
    'FLS': 'Flowserve Corporation',
    'FLR': 'Fluor Corp.',
    'FMC': 'FMC Corporation',
    'FL': 'Foot Locker Inc',
    'F': 'Ford Motor',
    'FTV': 'Fortive Corp',
    'FBHS': 'Fortune Brands Home & Security',
    'BEN': 'Franklin Resources',
    'FCX': 'Freeport-McMoRan Inc.',
    'GPS': 'Gap Inc.',
    'GRMN': 'Garmin Ltd.',
    'IT': 'Gartner Inc',
    'GD': 'General Dynamics',
    'GE': 'General Electric',
    'GGP': 'General Growth Properties Inc.',
    'GIS': 'General Mills',
    'GM': 'General Motors',
    'GPC': 'Genuine Parts',
    'GILD': 'Gilead Sciences',
    'GPN': 'Global Payments Inc.',
    'GS': 'Goldman Sachs Group',
    'GT': 'Goodyear Tire & Rubber',
    'GWW': 'Grainger (W.W.) Inc.',
    'HAL': 'Halliburton Co.',
    'HBI': 'Hanesbrands Inc',
    'HOG': 'Harley-Davidson',
    'HRS': 'Harris Corporation',
    'HIG': 'Hartford Financial Svc.Gp.',
    'HAS': 'Hasbro Inc.',
    'HCA': 'HCA Holdings',
    'HCP': 'HCP Inc.',
    'HP': 'Helmerich & Payne',
    'HSIC': 'Henry Schein',
    'HES': 'Hess Corporation',
    'HPE': 'Hewlett Packard Enterprise',
    'HLT': 'Hilton Worldwide Holdings Inc',
    'HOLX': 'Hologic',
    'HD': 'Home Depot',
    'HON': 'Honeywell Int\'l Inc.',
    'HRL': 'Hormel Foods Corp.',
    'HST': 'Host Hotels & Resorts',
    'HPQ': 'HP Inc.',
    'HUM': 'Humana Inc.',
    'HBAN': 'Huntington Bancshares',
    'HII': 'Huntington Ingalls Industries',
    'IDXX': 'IDEXX Laboratories',
    'INFO': 'IHS Markit Ltd.',
    'ITW': 'Illinois Tool Works',
    'ILMN': 'Illumina Inc',
    'INCY': 'Incyte',
    'IR': 'Ingersoll-Rand PLC',
    'INTC': 'Intel Corp.',
    'ICE': 'Intercontinental Exchange',
    'IBM': 'International Business Machines',
    'IP': 'International Paper',
    'IPG': 'Interpublic Group',
    'IFF': 'Intl Flavors & Fragrances',
    'INTU': 'Intuit Inc.',
    'ISRG': 'Intuitive Surgical Inc.',
    'IVZ': 'Invesco Ltd.',
    'IPGP': 'IPG Photonics Corp.',
    'IQV': 'IQVIA Holdings Inc.',
    'IRM': 'Iron Mountain Incorporated',
    'JBHT': 'J. B. Hunt Transport Services',
    'JEC': 'Jacobs Engineering Group',
    'SJM': 'JM Smucker',
    'JNJ': 'Johnson & Johnson',
    'JCI': 'Johnson Controls International',
    'JPM': 'JPMorgan Chase & Co.',
    'JNPR': 'Juniper Networks',
    'KSU': 'Kansas City Southern',
    'K': 'Kellogg Co.',
    'KEY': 'KeyCorp',
    'KMB': 'Kimberly-Clark',
    'KIM': 'Kimco Realty',
    'KMI': 'Kinder Morgan',
    'KLAC': 'KLA-Tencor Corp.',
    'KSS': 'Kohl\'s Corp.',
    'KHC': 'Kraft Heinz Co',
    'KR': 'Kroger Co.',
    'LB': 'L Brands Inc.',
    'LLL': 'L-3 Communications Holdings',
    'LH': 'Laboratory Corp. of America Holding',
    'LRCX': 'Lam Research',
    'LEG': 'Leggett & Platt',
    'LEN': 'Lennar Corp.',
    'LUK': 'Leucadia National Corp.',
    'LLY': 'Lilly (Eli) & Co.',
    'LNC': 'Lincoln National',
    'LKQ': 'LKQ Corporation',
    'LMT': 'Lockheed Martin Corp.',
    'L': 'Loews Corp.',
    'LOW': 'Lowe\'s Cos.',
    'LYB': 'LyondellBasell',
    'MTB': 'M&T Bank Corp.',
    'MAC': 'Macerich',
    'M': 'Macy\'s Inc.',
    'MRO': 'Marathon Oil Corp.',
    'MPC': 'Marathon Petroleum',
    'MAR': 'Marriott Int\'l.',
    'MMC': 'Marsh & McLennan',
    'MLM': 'Martin Marietta Materials',
    'MAS': 'Masco Corp.',
    'MA': 'Mastercard Inc.',
    'MAT': 'Mattel Inc.',
    'MKC': 'McCormick & Co.',
    'MCD': 'McDonald\'s Corp.',
    'MCK': 'McKesson Corp.',
    'MDT': 'Medtronic plc',
    'MRK': 'Merck & Co.',
    'MET': 'MetLife Inc.',
    'MTD': 'Mettler Toledo',
    'MGM': 'MGM Resorts International',
    'KORS': 'Michael Kors Holdings',
    'MCHP': 'Microchip Technology',
    'MU': 'Micron Technology',
    'MSFT': 'Microsoft Corp.',
    'MAA': 'Mid-America Apartments',
    'MHK': 'Mohawk Industries',
    'TAP': 'Molson Coors Brewing Company',
    'MDLZ': 'Mondelez International',
    'MON': 'Monsanto Co.',
    'MNST': 'Monster Beverage',
    'MCO': 'Moody\'s Corp',
    'MS': 'Morgan Stanley',
    'MSI': 'Motorola Solutions Inc.',
    'MYL': 'Mylan N.V.',
    'NDAQ': 'Nasdaq',
    'NOV': 'National Oilwell Varco Inc.',
    'NAVI': 'Navient',
    'NKTR': 'Nektar Therapeutics',
    'NTAP': 'NetApp',
    'NFLX': 'Netflix Inc.',
    'NWL': 'Newell Brands',
    'NFX': 'Newfield Exploration Co',
    'NEM': 'Newmont Mining Corporation',
    'NWSA': 'News Corp. Class A',
    'NWS': 'News Corp. Class B',
    'NEE': 'NextEra Energy',
    'NLSN': 'Nielsen Holdings',
    'NKE': 'Nike',
    'NI': 'NiSource Inc.',
    'NBL': 'Noble Energy Inc',
    'JWN': 'Nordstrom',
    'NSC': 'Norfolk Southern Corp.',
    'NTRS': 'Northern Trust Corp.',
    'NOC': 'Northrop Grumman Corp.',
    'NCLH': 'Norwegian Cruise Line',
    'NRG': 'NRG Energy',
    'NUE': 'Nucor Corp.',
    'NVDA': 'Nvidia Corporation',
    'ORLY': 'O\'Reilly Automotive',
    'OXY': 'Occidental Petroleum',
    'OMC': 'Omnicom Group',
    'OKE': 'ONEOK',
    'ORCL': 'Oracle Corp.',
    'PCAR': 'PACCAR Inc.',
    'PKG': 'Packaging Corporation of America',
    'PH': 'Parker-Hannifin',
    'PAYX': 'Paychex Inc.',
    'PYPL': 'PayPal',
    'PNR': 'Pentair Ltd.',
    'PBCT': 'People\'s United Financial',
    'PEP': 'PepsiCo Inc.',
    'PKI': 'PerkinElmer',
    'PRGO': 'Perrigo',
    'PFE': 'Pfizer Inc.',
    'PCG': 'PG&E Corp.',
    'PM': 'Philip Morris International',
    'PSX': 'Phillips 66',
    'PNW': 'Pinnacle West Capital',
    'PXD': 'Pioneer Natural Resources',
    'PNC': 'PNC Financial Services',
    'RL': 'Polo Ralph Lauren Corp.',
    'PPG': 'PPG Industries',
    'PPL': 'PPL Corp.',
    'PX': 'Praxair Inc.',
    'PFG': 'Principal Financial Group',
    'PG': 'Procter & Gamble',
    'PGR': 'Progressive Corp.',
    'PLD': 'Prologis',
    'PRU': 'Prudential Financial',
    'PEG': 'Public Serv. Enterprise Inc.',
    'PSA': 'Public Storage',
    'PHM': 'Pulte Homes Inc.',
    'PVH': 'PVH Corp.',
    'QRVO': 'Qorvo',
    'QCOM': 'QUALCOMM Inc.',
    'PWR': 'Quanta Services Inc.',
    'DGX': 'Quest Diagnostics',
    'RRC': 'Range Resources Corp.',
    'RJF': 'Raymond James Financial Inc.',
    'RTN': 'Raytheon Co.',
    'O': 'Realty Income Corporation',
    'RHT': 'Red Hat Inc.',
    'REG': 'Regency Centers Corporation',
    'REGN': 'Regeneron',
    'RF': 'Regions Financial Corp.',
    'RSG': 'Republic Services Inc',
    'RMD': 'ResMed',
    'RHI': 'Robert Half International',
    'ROK': 'Rockwell Automation Inc.',
    'COL': 'Rockwell Collins',
    'ROP': 'Roper Technologies',
    'ROST': 'Ross Stores',
    'RCL': 'Royal Caribbean Cruises Ltd',
    'SPGI': 'S&P Global',
    'CRM': 'Salesforce.com',
    'SBAC': 'SBA Communications',
    'SCG': 'SCANA Corp',
    'SLB': 'Schlumberger Ltd.',
    'STX': 'Seagate Technology',
    'SEE': 'Sealed Air',
    'SRE': 'Sempra Energy',
    'SHW': 'Sherwin-Williams',
    'SPG': 'Simon Property Group Inc',
    'SWKS': 'Skyworks Solutions',
    'SLG': 'SL Green Realty',
    'SNA': 'Snap-On Inc.',
    'SO': 'Southern Co.',
    'LUV': 'Southwest Airlines',
    'SWK': 'Stanley Black & Decker',
    'SBUX': 'Starbucks Corp.',
    'STT': 'State Street Corp.',
    'SRCL': 'Stericycle Inc',
    'SYK': 'Stryker Corp.',
    'STI': 'SunTrust Banks',
    'SIVB': 'SVB Financial',
    'SYMC': 'Symantec Corp.',
    'SYF': 'Synchrony Financial',
    'SNPS': 'Synopsys Inc.',
    'SYY': 'Sysco Corp.',
    'TROW': 'T. Rowe Price Group',
    'TTWO': 'Take-Two Interactive',
    'TPR': 'Tapestry',
    'TGT': 'Target Corp.',
    'TEL': 'TE Connectivity Ltd.',
    'FTI': 'TechnipFMC',
    'TXN': 'Texas Instruments',
    'TXT': 'Textron Inc.',
    'BK': 'The Bank of New York Mellon Corp.',
    'CLX': 'The Clorox Company',
    'COO': 'The Cooper Companies',
    'HSY': 'The Hershey Company',
    'MOS': 'The Mosaic Company',
    'TRV': 'The Travelers Companies Inc.',
    'DIS': 'The Walt Disney Company',
    'TMO': 'Thermo Fisher Scientific',
    'TIF': 'Tiffany & Co.',
    'TWX': 'Time Warner Inc.',
    'TJX': 'TJX Companies Inc.',
    'TMK': 'Torchmark Corp.',
    'TSS': 'Total System Services',
    'TSCO': 'Tractor Supply Company',
    'TDG': 'TransDigm Group',
    'TRIP': 'TripAdvisor',
    'FOXA': 'Twenty-First Century Fox Class A',
    'FOX': 'Twenty-First Century Fox Class B',
    'TSN': 'Tyson Foods',
    'USB': 'U.S. Bancorp',
    'UDR': 'UDR Inc',
    'ULTA': 'Ulta Beauty',
    'UAA': 'Under Armour Class A',
    'UA': 'Under Armour Class C',
    'UNP': 'Union Pacific',
    'UAL': 'United Continental Holdings',
    'UNH': 'United Health Group Inc.',
    'UPS': 'United Parcel Service',
    'URI': 'United Rentals',
    'UTX': 'United Technologies',
    'UHS': 'Universal Health Services',
    'UNM': 'Unum Group',
    'VFC': 'V.F. Corp.',
    'VLO': 'Valero Energy',
    'VAR': 'Varian Medical Systems',
    'VTR': 'Ventas Inc',
    'VRSN': 'Verisign Inc.',
    'VRSK': 'Verisk Analytics',
    'VZ': 'Verizon Communications',
    'VRTX': 'Vertex Pharmaceuticals Inc',
    'VIAB': 'Viacom Inc.',
    'V': 'Visa Inc.',
    'VNO': 'Vornado Realty Trust',
    'VMC': 'Vulcan Materials',
    'WMT': 'Wal-Mart Stores',
    'WBA': 'Walgreens Boots Alliance',
    'WM': 'Waste Management Inc.',
    'WAT': 'Waters Corporation',
    'WEC': 'Wec Energy Group Inc',
    'WFC': 'Wells Fargo',
    'WELL': 'Welltower Inc.',
    'WDC': 'Western Digital',
    'WU': 'Western Union Co',
    'WRK': 'WestRock Company',
    'WY': 'Weyerhaeuser Corp.',
    'WHR': 'Whirlpool Corp.',
    'WMB': 'Williams Cos.',
    'WLTW': 'Willis Towers Watson',
    'WYN': 'Wyndham Worldwide',
    'WYNN': 'Wynn Resorts Ltd',
    'XEL': 'Xcel Energy Inc',
    'XRX': 'Xerox Corp.',
    'XLNX': 'Xilinx Inc',
    'XL': 'XL Capital',
    'XYL': 'Xylem Inc.',
    'YUM': 'Yum! Brands Inc',
    'ZBH': 'Zimmer Biomet Holdings',
    'ZION': 'Zions Bancorp',
    'ZTS': 'Zoetis'
};