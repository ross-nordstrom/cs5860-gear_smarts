# Dataset: a1a
http://www.csie.ntu.edu.tw/~cjlin/libsvmtools/datasets/binary.html#a1a


 * Source: [UCI](http://www.ics.uci.edu/~mlearn/MLRepository.html) / Adult
 * Preprocessing: The original Adult data set has 14 features, among which six are continuous and eight are categorical.
    In this data set, continuous features are discretized into quantiles, and each quantile is represented by a binary feature.
    Also, a categorical feature with m categories is converted to m binary features. Details on how each feature is converted
    can be found in the beginning of each file from this page. [JP98a]
 * # of classes: 2
 * # of data: 1,605 / 30,956 (testing)
 * # of features: 123 / 123 (testing)
 * Files:
    * (train.txt) a1a
    * (test.txt) a1a.t (testing)

## GearSmarts API Results
Ran with commit 147dd5d (10-MAY-2015) and got the following:

```js
> x.train(x.logger)
undefined
> Train 1606 rows...
Done training.

Callback invoked:
ERR?  {}
RES?  undefined
> x.test(x.logger)
undefined
> Test 30957 rows...
Done testing.

Callback invoked:
ERR?  null
RES?  { count: 30957,
  raw: { TP: 318, TN: 21556, FP: 1954, FN: 7129 },
  precision: 0.13996478873239437,
  accuracy: 0.7065930161191329,
  recall: 0.04270175909762321,
  specificity: 0.9168864313058273 }
```
