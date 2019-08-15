var username = "velvetPhos";

var tagList = ["Amnesia"
      ,"Anti-Hero"
      ,"Battle Royale"
      ,"Boys' Love"
      ,"Classic Literature"
      ,"Coming of Age"
      ,"Cute Girls Doing Cute Things"
      ,"Cyberpunk"
      ,"Dystopian"
      ,"Ensemble Cast"
      ,"Episodic"
      ,"Family Life"
      ,"Female Protagonist"
      ,"Food"
      ,"Fugitive"
      ,"Harem"
      ,"Historical"
      ,"Idol"
      ,"Isekai"
      ,"Iyashikei"
      ,"Josei"
      ,"LGBTQ Issues"
      ,"Love Triangle"
      ,"Magic"
      ,"Male Protagonist"
      ,"Military"
      ,"Philosophy"
      ,"Politics"
      ,"Primarily Adult Cast"
      ,"Primarily Child Cast"
      ,"Primarily Female Cast"
      ,"Primarily Male Cast"
      ,"Revenge"
      ,"Reverse Harem"
      ,"School"
      ,"Seinen"
      ,"Shoujo"
      ,"Shounen"
      ,"Space"
      ,"Survival"
      ,"Time Skip"
      ,"Tragedy"
      ,"Video Games"
      ,"War"
      ,"Work"
      ,"Yuri"];

var basicFeatures = [
  "averageScore",
  "meanScore",
  "year",
  "popularity",
  "favourites",
  "episodes",
  "duration"
];

$(document).ready(function(){$('.les').click(addPredictionToList)});


async function addPredictionToList(){
  await createFeaturePolyfit();

  var predictionList = JSON.parse(localStorage.getItem("predictionList"));
  var listJ = JSON.parse(localStorage.getItem("listJson"));
  var plan = JSON.parse(localStorage.getItem("plan"));

  var result = await aggregatePredictions(predictionList);
  var sumWeight = await getSumWeight(predictionList);

  for (var i=0; i<plan.length; i++){
    plan[i]["name"] = listJ[plan[i]["mediaId"]]["title"];
    plan[i]["prediction"] =  result[i]/sumWeight;
  }

  console.log(plan);
  createTable(plan, $('.temp'));
}

function getSumWeight(predictionList){
  var sumWeight = 0;
  for (var i=0; i<predictionList.length;i++){
    sumWeight = sumWeight + predictionList[i]["weight"];
  }
  return sumWeight;
}

function aggregatePredictions(predictionList){
  result = new Array(predictionList[0]["result"].length).fill(0);

  for (var i=0; i<predictionList.length;i++){
    for (var j=0; j<predictionList[0]["result"].length; j++){
      result[j] = result[j] + predictionList[i]["result"][j]*predictionList[i]["weight"];
    }
  }
  return result;
}

async function createFeaturePolyfit(){
  var listJ = JSON.parse(localStorage.getItem("listJson"));
  var comp = JSON.parse(localStorage.getItem("comp"));
  var plan = JSON.parse(localStorage.getItem("plan"));

  var userScoreList = await createFeatureList(listJ, comp, "score");
  localStorage.setItem("userScoreList", JSON.stringify(userScoreList));

  var order = 7;

  var sumWeight = 0;

  var predictionList = [];

  for (var i=0; i<basicFeatures.length; i++){
    var featureList = await createFeatureList(listJ, comp, basicFeatures[i]);
    localStorage.setItem(basicFeatures[i] + "List", JSON.stringify(featureList));


    var coeff = createPolyfit(featureList, userScoreList, order);


    var featureListPlan = await createFeatureList(listJ, plan, basicFeatures[i]);
    var result = predictPolyfit(featureListPlan, coeff, order);

    var validation = await predictPolyfit(featureList, coeff, order);

    var correlation = corr(featureList, validation);

    console.log(validation);
    console.log(correlation);

    var weight = correlation*correlation

    predictionList.push({"weight": weight, "result": result});

    sumWeight = sumWeight + weight;
  }

  localStorage.setItem("predictionList", JSON.stringify(predictionList));

  console.log(JSON.parse(localStorage.getItem("predictionList")));
  console.log(sumWeight);
}

function computeFeatureList(){

}

function corr(X, Y) {
    var n = X.length;
    var sum_X = 0;
    var sum_Y = 0;
    var sum_XY = 0;
    var squareSum_X = 0;
    var squareSum_Y = 0;

    for (var i=0; i < n; i++){
        // sum of elements of array X.
        sum_X = sum_X + X[i];

        // sum of elements of array Y.
        sum_Y = sum_Y + Y[i];

        // sum of X[i] * Y[i].
        sum_XY = sum_XY + X[i] * Y[i];

        // sum of square of array elements.
        squareSum_X = squareSum_X + X[i] * X[i];
        squareSum_Y = squareSum_Y + Y[i] * Y[i];
    }

    // use formula for calculating correlation
    // coefficient.
    var result = (n * sum_XY - sum_X * sum_Y)/(Math.sqrt((n * squareSum_X - sum_X * sum_X) * (n * squareSum_Y - sum_Y * sum_Y)));

    return result;
}

function createFeatureList(list, comp, name){
  var featureList = [];

  for (var i=0; i<comp.length; i++){
    featureList.push(list[comp[i]["mediaId"]][name]);
  }
  return featureList;
}

function predictPolyfit(x, coeff, order){
  var xMatrix = [];

  for (j=0;j<x.length;j++)
  {
      xTemp = [];
      for(i=0;i<=order;i++)
      {
          xTemp.push(1*Math.pow(x[j],i));
      }
      xMatrix.push(xTemp);
  }
  return numeric.transpose(numeric.dot(xMatrix, coeff))[0];
}

function createPolyfit(x, y, order){
  var xMatrix = [];
  var xTemp = [];
  var yMatrix = numeric.transpose([y]);

  for (j=0;j<x.length;j++)
  {
      xTemp = [];
      for(i=0;i<=order;i++)
      {
          xTemp.push(1*Math.pow(x[j],i));
      }
      xMatrix.push(xTemp);
  }

  var xMatrixT = numeric.transpose(xMatrix);
  var dot1 = numeric.dot(xMatrixT,xMatrix);
  var dotInv = numeric.inv(dot1);
  var dot2 = numeric.dot(xMatrixT,yMatrix);
  var solution = numeric.dot(dotInv,dot2);
  console.log("Coefficients a + bx^1 + cx^2...")
  console.log(solution);
  return solution;
}


function createListOfAllEntries(){
  var listJ = JSON.parse(localStorage.getItem("listJson"));
  var keys = [];
  for(var k in listJ){keys.push(k)};
  localStorage.setItem("listEntries", JSON.stringify(keys));
  localStorage.setItem("listRemainings", JSON.stringify(keys));
}

async function fetchAllMedia(){
  var listR = JSON.parse(localStorage.getItem("listRemainings"));

  var interval = setInterval(async function(){
    if(listR.length<=0) {
      clearInterval(interval);
    }
    var id = listR[0];
    var listJ = JSON.parse(localStorage.getItem("listJson"));
    var data = await fetchMedia(id);
    console.log(data);

    listJ = await alterMediaData(listJ, id, data);

    listR.shift();

    localStorage.setItem("listJson", JSON.stringify(listJ));
    localStorage.setItem("listRemainings", JSON.stringify(listR));

  }, 1000);

}

async function alterMediaData(listJ, id, data){


        data = data['data']['Media'];

        listJ[id.toString()]['averageScore'] = data['averageScore'];
        listJ[id.toString()]['duration'] = data['duration'];
        listJ[id.toString()]['episodes'] = data['episodes'];
        listJ[id.toString()]['coverImage'] = data['coverImage'];
        listJ[id.toString()]['format'] = data['format'];
        listJ[id.toString()]['favourites'] = data['favourites'];
        listJ[id.toString()]['genres'] = data['genres'];
        listJ[id.toString()]['meanScore'] = data['meanScore'];
        listJ[id.toString()]['year'] = data['startDate']['year'];
        listJ[id.toString()]['popularity'] = data['popularity'];
        listJ[id.toString()]['source'] = data['source'];
        listJ[id.toString()]['title'] = data['title']['romaji'];

        listJ[id.toString()]['tags'] = await createTagList(data['tags']);

        return listJ;

        function createTagList(tags){
          var tempList = [];
          for (var i=0; i<tags.length; i++){
            if (tagList.includes(tags[i]['name'])){
              tempList.push(tags[i]['name']);
            }
          }
          return tempList;
        }
}

function fetchMedia(id){
  const query = `query a($id: Int){

    Media(id: $id,type: ANIME){
    	title {
    	  romaji
    	}
      startDate {
        year
      }
    	format
      favourites
    	episodes
      duration
    	genres
    	tags {
        name
    	}
    	averageScore
    	meanScore
      source
    	popularity
    	coverImage {
    	  large
    	}
    }
}`;

  // Define our query variables and values that will be used in the query request
  var variables = {
      id: id
  };

  // Define the config we'll need for our Api request
  var url = 'https://graphql.anilist.co',
      options = {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
          },
          body: JSON.stringify({
              query: query,
              variables: variables
          })
      };


  // Make the HTTP Api request
  return fetch(url, options).then(handleResponse)
                     .then(handleData)
                     .catch(handleError);




  function handleResponse(response) {
      return response.json().then(function (json) {
          return response.ok ? json : Promise.reject(json);
      });
  }

  function handleData(data) {
    return data;
  }

  function handleError(error) {
      console.error(error);
  }
}

function fetchUserList(){

    const query = `query a($userName: String){

        MediaListCollection(userName: $userName, type: ANIME, sort: MEDIA_ID){
          lists {
            entries {
              mediaId
              score
            }
            name
          }
        }
    }`;

    // Define our query variables and values that will be used in the query request
    var variables = {
        userName: username
    };

    // Define the config we'll need for our Api request
    var url = 'https://graphql.anilist.co',
        options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables
            })
        };

    var comp = [];
    var plan = [];


    // Make the HTTP Api request
    fetch(url, options).then(handleResponse)
                       .then(handleData)
                       .catch(handleError);

    function handleResponse(response) {
        return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
        });
    }

    function handleData(data) {
        var j = data['data']['MediaListCollection']['lists'].length;
        var lists = data['data']['MediaListCollection']['lists'];

        for (var i=0;i<j;i++){
          if (lists[i]['name'] == 'Completed'){
            comp = lists[i]['entries'];
          }
          if (lists[i]['name'] == 'Planning'){
            plan = lists[i]['entries'];
          }
        }

        //$('.temp').html(comp[0]['mediaId']);
        //createTable(comp, $('.temp'));
        storeData();
        //createTable(localStorage.getItem("comp"), $('.temp'));
        console.log(comp);
    }

    function storeData(){
      localStorage.setItem("comp", JSON.stringify(comp));
      localStorage.setItem("plan", JSON.stringify(plan));
    }

    function handleError(error) {
        console.error(error);
    }

}

function storeList(){
  var comp = JSON.parse(localStorage.getItem("comp"));
  var plan = JSON.parse(localStorage.getItem("plan"));
  var listJson = {};
  for(var i=0; i<comp.length; i++){
    listJson[comp[i]['mediaId']] = {"score":comp[i]['score']};
  }
  for(var i=0; i<plan.length; i++){
    listJson[plan[i]['mediaId']] = {"score":plan[i]['score']};
  }
  localStorage.setItem("listJson", JSON.stringify(listJson));
}

function createTable(list, selector){
  var keys = [];
  for(var k in list[0]){keys.push(k)};

  table = $('<table></table>');
  header = $('<tr></tr>');
  for (var i=0; i<keys.length; i++){
    header.append('<th>'+ keys[i] +'</th>');
  }
  table.append(header);

  for (var i=0; i<list.length; i++){
    row = $('<tr></tr>');
    for (var j=0; j<keys.length; j++){
      row.append('<th>'+ list[i][keys[j]] +'</th>');
    }
    table.append(row);
  }
  selector.append(table);
}
