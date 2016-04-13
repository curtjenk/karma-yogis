//factory for managing local storage
recipeApp.factory('utilLocalStore', function($window, $rootScope) {
    return {
        setUserName: function(val) {
            $window.localStorage.setItem('user-name', val);
            return this;
        },
        getUserName: function() {
            return $window.localStorage.getItem('user-name');
        },
        setUserPswd: function(val) {
            $window.localStorage.setItem('user-pswd', val);
            return this;
        },
        getUserPswd: function() {
            return $window.localStorage.getItem('user-pswd');
        },
        setUserEmail: function(val) {
            $window.localStorage.setItem('user-email', val);
            return this;
        },
        getUserEmail: function() {
            return $window.localStorage.getItem('user-email');
        },
        setUserHandle: function(val) {
            $window.localStorage.setItem('user-handle', val);
            return this;
        },
        getUserHandle: function() {
            return $window.localStorage.getItem('user-handle');
        },
        setUserFavFood: function(valList) {
            $window.localStorage.setItem('user-fav-food', valList);
            return this;
        },
        getUserFavFood: function() {
            return $window.localStorage.getItem('user-fav-food');
        },
        setInventory: function(inventoryItem) {
            $window.localStorage.setItem('inventory', JSON.stringify(inventoryItem));
            return this;
        },
        getInventory: function() {
            return JSON.parse($window.localStorage.getItem('inventory'));
        }
    };

});


var WeatherSearchResults = function(data) {
    data = data || {};
    this.currTemp = data.currTemp;
    this.maxTemp = data.maxTemp;
    this.minTemp = data.minTemp;
    this.humidity = data.humidity;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.weatherDescription = data.weatherDescription;
    this.weatherMain = data.weatherMain;
    this.weatherIconURL = data.weatherIconURL;
    this.sunriseEpoch = data.sunrise;
    this.sunsetEpoch = data.sunset;
    this.country = data.country;
};
WeatherSearchResults.prototype.sunriseLocalTime = function() {
    var d = new Date(0);
    d.setUTCSeconds(this.sunriseEpoch);
    return d.toLocaleTimeString();
};
WeatherSearchResults.prototype.sunsetLocalTime = function() {
    var d = new Date(0);
    d.setUTCSeconds(this.sunsetEpoch);
    return d.toLocaleTimeString();
};

recipeApp.factory('weatherApi', function($http) {
    return {
        getWeather: function(city, apiKey, successFunc, failFunc) {
            var apiKeyParam = '&APPID=' + apiKey;
            var unitsParam = '&units=imperial';
            var searchParam = '?q=';
            var weatherURL = 'http://api.openweathermap.org/data/2.5/weather';
            var iconURL = 'http://openweathermap.org/img/w/';
            var URL = encodeURI(weatherURL + searchParam + city + unitsParam + apiKeyParam);
            //console.log("Weather url = " + URL);
            $http.get(URL).then(
                /* success*/
                function(response) {
                    var weatherData = response.data;
                    var searchResults = new WeatherSearchResults({});
                    searchResults.currTemp = weatherData.main.temp;
                    searchResults.maxTemp = weatherData.main.temp_max;
                    searchResults.minTemp = weatherData.main.temp_min;
                    searchResults.humidity = weatherData.main.humidity;
                    searchResults.latitude = weatherData.coord.lat;
                    searchResults.longitude = weatherData.coord.lon;
                    searchResults.weatherDescription = weatherData.weather[0].description;
                    searchResults.weatherMain = weatherData.weather[0].main;
                    searchResults.weatherIconURL = iconURL + weatherData.weather[0].icon + '.png';
                    searchResults.sunriseEpoch = weatherData.sys.sunrise; //seconds since EPOCH
                    searchResults.sunsetEpoch = weatherData.sys.sunset; //seconds
                    searchResults.country = weatherData.sys.country;
                    successFunc(searchResults);
                },
                /* error*/
                function(response) {
                    failFunc(response);
                });
        }
    };
});

var RecipeArray = [];
var RecipeIngredient = function(data) {
    data = data || {};
    this.text = data.text;
    this.quantity = data.quantity;
    this.food = data.food;
    this.weight = data.weight;
    this.measure = data.measure;
};
var RecipeSearchResults = function(data) {
    data = data || {};
    this.sourceDisplayName = data.sourceDisplayName;
    this.recipeId = data.recipeId;
    this.recipeName = data.recipeName;
    this.thumbnailImageURL = data.imageURL;
    this.largeImageURL = data.largeImageURL;
    this.rating = data.rating; // or Rating
    // this.ingredientLines = data.ingredientLines;
    this.ingredients = data.ingredients;
    this.prepTime = data.prepTime;

};

function secondsToMin(seconds) {
    var minutes = Math.ceil(seconds / 60);
    var time = '';
    if (seconds < 60) {
        return '';
    }
    if (minutes >= 60) {
        if (minutes % 60 === 0) {
            time = minutes / 60 + ' min';
        } else {
            time = Math.floor(minutes / 60) + ' hrs ' + (minutes - 60) + ' min';
        }
    } else {
        time = minutes + ' min';

    }

    return time;
}


recipeApp.factory('recipesApi', function($http) {
    return {
        getRecipes: function(max, query, apiKey, apiId, successFunc, failFunc) {
            //
            //http://api.yummly.com/v1/api/recipes?_app_id=e0a0ad85&_app_key=30d09c4f5cd26c2e94067912d367b9c6&maxResult=50&q=
            //   &maxResult    
            var _apiId = '&_app_id=' + apiId;
            var _apiKey = '&_app_key=' + apiKey;
            var _query = '&q=' + query;
            var _maxRes = '&maxResult=' + max || 10;
            var _URL = 'http://api.yummly.com/v1/api/recipes?';
            var results = {};
            _URL = encodeURI(_URL + _apiKey + _apiId + _query + _maxRes);
            //console.log(_URL);
            $http.get(_URL).then(
                /* success*/
                function(response) {
                    RecipeArray = [];
                    var hits = response.data.matches;
                    for (var i = 0; i < hits.length && i < max; i++) {
                        var hit = hits[i];
                        res = new RecipeSearchResults({});
                        res.recipeId = hit.id;
                        res.recipeName = hit.recipeName;
                        res.rating = hit.rating;
                        res.sourceDisplayName = hit.sourceDisplayName;
                        if (hit.smallImageUrls && hit.smallImageUrls.length > 0) {
                            res.thumbnailImageURL = hit.smallImageUrls[0];
                            res.largeImageURL = hit.smallImageUrls[0].replace('=s90', '=s325-c-e370');
                        } else {
                            res.thumbnailImageURL = '';
                            res.largeImageURL = '';
                        }
                        res.ingredients = hit.ingredients;
                        res.prepTime = secondsToMin(hit.totalTimeInSeconds);
                        RecipeArray.push(res);
                    }
                    // console.log(RecipeArray);
                    successFunc(RecipeArray);
                },
                /* error*/
                function(errorRes) {
                    failFunc(errorRes);
                });
        }
    };
});