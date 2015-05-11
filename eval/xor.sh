#!/usr/bin/env bash

http http://localhost:8080/v1/ml/xor/train/false features==[0,0] >/dev/null
http http://localhost:8080/v1/ml/xor/train/true features==[0,1] >/dev/null
http http://localhost:8080/v1/ml/xor/train/true features==[1,0] >/dev/null
http http://localhost:8080/v1/ml/xor/train/false features==[1,1] >/dev/null

http http://localhost:8080/v1/ml/xor

echo "EXPECTED | ACTUAL  "
echo "---------|---------"
F1=$(http http://localhost:8080/v1/ml/xor/classify features==[0,0] | tail -1)
echo "   false | $F1"

T1=$(http http://localhost:8080/v1/ml/xor/classify features==[0,1] | tail -1)
echo "    true | $T1"

T2=$(http http://localhost:8080/v1/ml/xor/classify features==[1,0] | tail -1)
echo "    true | $T2"

F2=$(http http://localhost:8080/v1/ml/xor/classify features==[1,1] | tail -1)
echo "   false | $F2"
