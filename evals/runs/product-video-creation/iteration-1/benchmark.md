# Benchmark · product-video-creation · iteration 1

| Eval | Config | Passed | Pass rate | Tokens | Time |
|---|---|---|---|---|---|
| eval-1-taskboard-product-video | with_skill | 10/10 | 100% | 142,580 | 665 s |
| eval-1-taskboard-product-video | without_skill | 5/10 | 50% | 85,769 | 612 s |
| eval-2-release-video-with-setup | with_skill | 8/8 | 100% | 132,455 | 479 s |
| eval-2-release-video-with-setup | without_skill | 4/8 | 50% | 79,952 | 446 s |
| eval-3-no-premium-voices | with_skill | 5/5 | 100% | 50,410 | 30 s |
| eval-3-no-premium-voices | without_skill | 0/5 | 0% | 83,267 | 387 s |

| Config | Mean pass rate | Mean tokens | Mean time |
|---|---|---|---|
| with_skill | 100% | 108,482 | 391 s |
| without_skill | 33% | 82,996 | 482 s |
