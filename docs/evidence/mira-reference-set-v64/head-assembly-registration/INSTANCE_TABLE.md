# Exact instance correspondence — design ledger only

80 instance IDs have explicit counterparts. Only six existing seam records have numeric bilateral geometry. All other directions are declared conventions, not validated surface winding.

| Instance | Type / layer | Named interface IDs | Open ports |
|---|---|---|---|
| F01-L | F01 / skin | HI-007, HI-009, HI-065, HI-085, HI-089, HI-109 |  |
| F01-R | F01 / skin | HI-008, HI-010, HI-066, HI-086, HI-089, HI-122 |  |
| F03-L | F03 / skin | HI-007, HI-011, HI-013, HI-015, HI-083, HI-102, HI-111 |  |
| F03-R | F03 / skin | HI-008, HI-012, HI-014, HI-016, HI-084, HI-115, HI-124 |  |
| F05-L | F05 / skin | HI-006, HI-013, HI-021, HI-025 | OPEN-F05-L-outer-u1 |
| F05-R | F05 / skin | HI-001, HI-014, HI-022, HI-026 | OPEN-F05-R-outer-u1 |
| F07-L | F07 / skin | HI-005, HI-006, HI-027, HI-033 | OPEN-F07-L-outer-u1 |
| F07-R | F07 / skin | HI-001, HI-002, HI-028, HI-034 | OPEN-F07-R-outer-u1 |
| F09-L | F09 / skin | HI-004, HI-005, HI-035, HI-081 |  |
| F09-R | F09 / skin | HI-002, HI-003, HI-036, HI-082 |  |
| F14-L | F14 / skin | HI-031, HI-071, HI-073 | OPEN-F14-L-nostril-inner |
| F14-R | F14 / skin | HI-032, HI-072, HI-074 | OPEN-F14-R-nostril-inner |
| F11 | F11 / skin | HI-003, HI-004, HI-094, HI-095 |  |
| F12 | F12 / skin | HI-065, HI-066, HI-067, HI-068, HI-069, HI-070, HI-090 |  |
| F13 | F13 / skin | HI-071, HI-072, HI-090, HI-091 |  |
| F16a | F16a / skin | HI-077, HI-078, HI-093, HI-125 | OPEN-F16a-inner-mouth |
| F16b | F16b / skin | HI-075, HI-076, HI-092, HI-093 |  |
| F17 | F17 / skin | HI-079, HI-080, HI-094, HI-125 | OPEN-F17-shape |
| S01 | S01 / skin | HI-083, HI-084, HI-085, HI-086, HI-096, HI-099, HI-112, HI-126, HI-127, HI-128, HI-129, HI-134, HI-135 |  |
| S02 | S02 / skin | HI-096, HI-097, HI-100, HI-113, HI-130, HI-131, HI-132, HI-133, HI-142, HI-143 |  |
| S03 | S-SIDE / skin | HI-099, HI-100, HI-101, HI-102, HI-103, HI-104, HI-136, HI-137, HI-138 |  |
| S04 | S-SIDE / skin | HI-112, HI-113, HI-114, HI-115, HI-116, HI-117, HI-139, HI-140, HI-141 |  |
| S05 | S05 / skin | HI-097, HI-098, HI-101, HI-114, HI-144, HI-145, HI-146, HI-147, HI-148, HI-149 |  |
| A01a-L | A01a / skin | HI-043, HI-045, HI-047, HI-049 | OPEN-A01a-L-inner-attachment-section |
| A01a-R | A01a / skin | HI-044, HI-046, HI-048, HI-050 | OPEN-A01a-R-inner-attachment-section |
| A01b-L | A01b / skin | HI-043, HI-051, HI-053 |  |
| A01b-R | A01b / skin | HI-044, HI-052, HI-054 |  |
| A02a-L | A02a / skin | HI-045, HI-051, HI-055, HI-057, HI-059 | OPEN-A02a-L-ear-canal |
| A02a-R | A02a / skin | HI-046, HI-052, HI-056, HI-058, HI-060 | OPEN-A02a-R-ear-canal |
| A02b-L | A02b / skin | HI-055, HI-061 |  |
| A02b-R | A02b / skin | HI-056, HI-062 |  |
| A03-L | A03 / skin | HI-047, HI-053, HI-057, HI-063 |  |
| A03-R | A03 / skin | HI-048, HI-054, HI-058, HI-064 |  |
| E01-L | E01 / ocular-body | HI-106, HI-107, HI-108 |  |
| E01-R | E01 / ocular-body | HI-119, HI-120, HI-121 |  |
| E02-L | E02 / ocular-front | HI-106 |  |
| E02-R | E02 / ocular-front | HI-119 |  |
| E03-L | E03 / skin | HI-009, HI-011, HI-037, HI-041, HI-107, HI-110 |  |
| E03-R | E03 / skin | HI-010, HI-012, HI-038, HI-042, HI-120, HI-123 |  |
| B01-L | B01 / brow | HI-109, HI-110, HI-111 |  |
| B01-R | B01 / brow | HI-122, HI-123, HI-124 |  |
| N01 | N01 / skin | HI-081, HI-082, HI-095, HI-105, HI-118 | OPEN-N01-costume-cut |
| N02 | N02 / skin | HI-087, HI-088, HI-098, HI-104, HI-105, HI-117, HI-118 | OPEN-N02-costume-cut |
| H01 | HT01 / hair | HI-126, HI-150, HI-153 |  |
| H02 | HT01 / hair | HI-127, HI-150, HI-151, HI-154 |  |
| H03 | HT01 / hair | HI-128, HI-151, HI-152 |  |
| H04 | HT01 / hair | HI-129, HI-152, HI-155 |  |
| H09 | HT01 / hair | HI-134, HI-153 |  |
| H10 | HT01 / hair | HI-135, HI-154 |  |
| H05 | HT02 / hair | HI-130, HI-155, HI-156, HI-157 |  |
| H06 | HT02 / hair | HI-131, HI-156, HI-158 |  |
| H07 | HT02 / hair | HI-132, HI-157, HI-159 |  |
| H08 | HT02 / hair | HI-133, HI-158, HI-160 |  |
| H11 | HT03 / hair | HI-136, HI-161 |  |
| H12 | HT03 / hair | HI-137, HI-161, HI-162 |  |
| H14 | HT03 / hair | HI-139, HI-163 |  |
| H15 | HT03 / hair | HI-140, HI-163, HI-164 |  |
| H13 | HT04 / hair | HI-138, HI-162 |  |
| H16 | HT04 / hair | HI-141, HI-164 |  |
| H17 | HT05 / hair | HI-142, HI-159, HI-165 |  |
| H18 | HT05 / hair | HI-143, HI-160, HI-166 |  |
| H19 | HT05 / hair | HI-144, HI-165, HI-167, HI-168 |  |
| H20 | HT05 / hair | HI-145, HI-166, HI-169, HI-170 |  |
| H21 | HT06 / hair | HI-146, HI-167 |  |
| H22 | HT06 / hair | HI-147, HI-168 |  |
| H23 | HT06 / hair | HI-148, HI-169 |  |
| H24 | HT06 / hair | HI-149, HI-170 |  |
| E04-L | E04 / skin | HI-017, HI-039, HI-041, HI-108 |  |
| E04-R | E04 / skin | HI-018, HI-040, HI-042, HI-121 |  |
| E05-L | E05 / skin | HI-019, HI-037, HI-039, HI-067 |  |
| E05-R | E05 / skin | HI-020, HI-038, HI-040, HI-068 |  |
| F18-L | F18 / skin | HI-015, HI-017, HI-019, HI-021, HI-023, HI-069 |  |
| F18-R | F18 / skin | HI-016, HI-018, HI-020, HI-022, HI-024, HI-070 |  |
| F19-L | F19 / skin | HI-023, HI-025, HI-027, HI-029, HI-031, HI-075 |  |
| F19-R | F19 / skin | HI-024, HI-026, HI-028, HI-030, HI-032, HI-076 |  |
| F20-L | F20 / skin | HI-029, HI-033, HI-035, HI-077, HI-079 |  |
| F20-R | F20 / skin | HI-030, HI-034, HI-036, HI-078, HI-080 |  |
| F15 | F15 / skin | HI-073, HI-074, HI-091, HI-092 |  |
| A04-L | A04 / skin | HI-049, HI-059, HI-061, HI-063, HI-087, HI-103 |  |
| A04-R | A04 / skin | HI-050, HI-060, HI-062, HI-064, HI-088, HI-116 |  |
