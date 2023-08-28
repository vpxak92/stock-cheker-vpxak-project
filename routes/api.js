'use strict';

const mongoose = require("mongoose");
const mongodb = require("mongodb");

var stockSchema = mongoose.Schema({
  stockData: {
    stock: String,
    price: Number,
    likes: Number,
    check: String
  },
  liked: Boolean,
  hashed: String
});
const stockModel = mongoose.model('stockModel', stockSchema);

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const { createHash } = await import('node:crypto');
      const url = "https://stock-price-checker.freecodecamp.rocks/"
      const symbol = req.query.stock;
      const symbol_one = req.query.stock[0];
      const symbol_two = req.query.stock[1];
      //count number of document that contain certain stock in the db (to count number of like (we just store stock+hash if stock liked))
      let likecount = await stockModel.find({ 'stockData.stock': symbol }).count();
      const likeA = await stockModel.countDocuments({ 'stockData.stock': symbol_one });
      const likeB = await stockModel.countDocuments({ 'stockData.stock': symbol_two });
      //count the difference between number of like symbol_one and symbol_two got
      const diff = likeA > likeB ? likeA - likeB : likeB - likeA;

      //if symbol is not object (when user passes 2 stock we get an object) we make request to api and store the data
      if (typeof symbol != "object") {
        const response = await fetch(url + `api/stock-prices?stock=${symbol}`);
        const data = await response.json();
        //if like true we create a hash with ip+symbol and we look up in db if we already have similar hash stored
        if (req.query.like == "true") {
          var hash = createHash('sha256').update(req.socket.remoteAddress + symbol).digest('hex');
          var check = await stockModel.exists({ hashed: hash });
          //if no similar hash stored we save this doc
          if (check == null) {
            likecount += 1;
            const doc = new stockModel();
            doc.stockData.stock = symbol;
            doc.stockData.likes = likecount;
            doc.hashed = hash;
            await doc.save();
          };
        }
        //set the structure of response we display to user and then send it
        let finalresult = {stockData: { stock: symbol, price: data.stockData.price, likes: likecount }};
        res.send(finalresult);
      }
      else {
        const response = await fetch(url + `api/stock-prices?stock=${symbol_one}&stock=${symbol_two}`);
        const data = await response.json();
        //Sometimes api we call to get stock info return the stock at the wrong place in array, this fixe the problem
        let twoStock = [data.stockData[0].stock, data.stockData[1].stock];
        if (data.stockData[0].stock != req.query.stock[0]) {
          twoStock = [data.stockData[1].stock, data.stockData[0].stock];
        }
        //create model with stock, hash of ip+stock and then look up in db it this hash already exist (you already like the stock) 
        if (req.query.like == "true") {
          const doc1 = new stockModel();
          const doc2 = new stockModel();
          const hash1 = createHash('sha256').update(req.socket.remoteAddress + symbol_one).digest('hex');
          const hash2 = createHash('sha256').update(req.socket.remoteAddress + symbol_two).digest('hex');
          const check1 = await stockModel.exists({ hashed: hash1 });
          const check2 = await stockModel.exists({ hashed: hash2 });
          //if check is null (response we get when the hash(ip+stock) when hash does not exist) and we save it (store the doc in mongodb)
          if (check1 == null) {
            doc1.stockData.stock = data["stockData"][0]["stock"];
            doc1.hashed = hash1;
            await doc1.save();
          };
          if (check2 == null) {
            doc2.stockData.stock = data["stockData"][1]["stock"];
            doc2.hashed = hash2;
            await doc2.save();
          };
        }
        //set the structure of response we display to user and then send it
        let finalres = {stockData: [
          { stock: twoStock[0], price: data.stockData[0].price, rel_likes: diff },
          { stock: twoStock[1], price: data.stockData[1].price, rel_likes: diff }
        ]};
        res.send(finalres);
      }
    });
};