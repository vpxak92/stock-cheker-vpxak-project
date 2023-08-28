const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');


chai.use(chaiHttp);

suite('Functional Tests', function () {
  
  test('1 stock', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'AAPL' })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "AAPL");
        assert.approximately(Number(res.body.stockData.price), 180, 160);
        assert.approximately(res.body.stockData.likes, 0, 27);
        done();
      });
  });
  
  test('1 stock + like', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'TSLA', like: true })
      .end((err, res) => {
          assert.equal(res.status, 200);
          assert.equal(res.body.stockData.stock, "TSLA");
          assert.approximately(Number(res.body.stockData.price), 250, 200);
          assert.approximately(res.body.stockData.likes, 0, 27);
          done();
      });
  });
  
  test('like the same stock', function (done) {
    chai.request(server)
      .get('/api/stock-prices')
      .query({ stock: 'TSLA', like: true })
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.body.stockData.stock, "TSLA");
        assert.approximately(Number(res.body.stockData.price), 250, 200);
        assert.approximately(res.body.stockData.likes, 0, 27);
        done();
      });
  });
  
  test('2 stocks + like', function (done) {
    chai.request(server).get('/api/stock-prices?stock=MSFT&stock=GOOG&like=true').end((err, res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.stockData[0].stock, "MSFT");
      assert.approximately(Number(res.body.stockData[0].price), 350, 275);
      assert.approximately(res.body.stockData[0].rel_likes, 100, 150);
      assert.equal(res.body.stockData[1].stock, "GOOG");
      assert.approximately(Number(res.body.stockData[1].price), 350, 275);
      assert.approximately(res.body.stockData[1].rel_likes, 0, 27);
      done();
    });
  });
  
  test('2 stock', function (done) {
    chai.request(server).get('/api/stock-prices?stock=AAPL&stock=TSLA').end((err, res) => {
      assert.equal(res.status, 200);
      assert.equal(res.body.stockData[0].stock, "AAPL");
      assert.approximately(Number(res.body.stockData[0].price), 250, 175);
      assert.approximately(res.body.stockData[0].rel_likes, 0, 27);
      assert.equal(res.body.stockData[1].stock, "TSLA");
      assert.approximately(Number(res.body.stockData[1].price), 200, 125);
      assert.approximately(res.body.stockData[1].rel_likes, 0, 27);
      done();
    });
  });
});