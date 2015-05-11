# Dataset: a2a
http://www.csie.ntu.edu.tw/~cjlin/libsvmtools/datasets/binary.html#a2a

 * Source: [UCI](http://www.ics.uci.edu/~mlearn/MLRepository.html) / Adult
 * Preprocessing: The same as a1a. [JP98a]
 * # of classes: 2
 * # of data: 2,265 / 30,296 (testing)
 * # of features: 123 / 123 (testing)
 * Files:
    * (train.txt) a2a
    * (test.txt) a2a.t (testing)

## GearSmarts API Results

```js
>  x.train('a2a', x.logger);
undefined
> Train 2266 rows...
Skipping bad row:  [ [], '' ]:8080/v1/ml/evalApi_a2a/train/-1
Done training 2266 rows. Dumping dataset...

Callback invoked:
ERR?  null
RES?  [ [ [ '3',
      '11',
      '14',
      '19',
      '39',
      '42',
      '55',
      '64',
      '67',
      '73',
      '75',
      '76',
      '80',
      '83' ],
    '-1' ],
  [ ...] ]

 + 2166 more...

undefined
>  x.test('a2a', '+1', x.logger);
undefined
> Test 30297 rows...
Skipping bad row:  [ [], '' ]ost:8080/v1/ml/evalApi_a2a/classify
Done testing.

Callback invoked:
ERR?  null
RES?  { count: 30297,
  raw: { TP: 312, TN: 21114, FP: 1913, FN: 6957 },
  accuracy: 0.707,
  precision: 0.14,
  recall: 0.043,
  specificity: 0.917 }

```
