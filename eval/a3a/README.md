# Dataset: a3a
http://www.csie.ntu.edu.tw/~cjlin/libsvmtools/datasets/binary.html#a3a

 * Source: UCI / Adult
 * Preprocessing: The same as a1a. [JP98a]
 * # of classes: 2
 * # of data: 3,185 / 29,376 (testing)
 * # of features: 123 / 123 (testing)
 * Files:
    * (train.txt) a3a
    * (test.txt) a3a.t (testing)

## GearSmarts API Results

```js
>  x.train('a3a', x.logger);
undefined
> Train 3186 rows...
Skipping bad row:  [ [], '' ]:8080/v1/ml/evalApi_a3a/train/-1
Done training 3186 rows. Dumping dataset...

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
  [ [ ... ] ]


 + 3006 more...

undefined
>  x.test('a3a', '+1', x.logger);
undefined
> Test 29377 rows...
Skipping bad row:  [ [], '' ]ost:8080/v1/ml/evalApi_a3a/classify
Done testing.

Callback invoked:
ERR?  null
RES?  { count: 29377,
  raw: { TP: 0, TN: 22308, FP: 0, FN: 7068 },
  accuracy: 0.759,
  precision: NaN,
  recall: 0,
  specificity: 1 }
```
