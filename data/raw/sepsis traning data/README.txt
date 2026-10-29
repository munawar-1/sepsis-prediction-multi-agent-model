Cleaned PhysioNet 2019 training_setA files

Files: train.csv, validation.csv, test.csv. A patient appears in exactly one split. Patient split is stratified by whether that patient ever has SepsisLabel=1; random seed 42; approximate 70/15/15 split.
Rows remain hourly. NaN values in selected model features were median-imputed using training split rows only. Each feature has a *_was_missing indicator (1 means original value was missing). The original source files were not modified.
Columns patient_id, ICULOS, SepsisLabel are metadata/target, not input features. Vitals features: HR, SBP, MAP, Resp, O2Sat, Temp. Lab features: Lactate, WBC, Creatinine, Platelets. Use separate feature subsets for the two models; do not feed SepsisLabel or patient_id as model inputs. No future fill or lookahead features were added. Random Forests do not require scaling.
Median values fitted on training rows:
HR: 84.0
SBP: 118.0
MAP: 77.0
Resp: 18.0
O2Sat: 98.0
Temp: 37.06
Lactate: 1.8
WBC: 10.8
Creatinine: 0.9
Platelets: 180.0

Counts (patients, rows, positive hourly labels, file bytes):
train: (14235, 552665, 11999, 47050279)
validation: (3050, 118499, 2563, 10086791)
test: (3051, 119051, 2574, 10137740)
