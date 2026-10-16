#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
zjs2points.py — 把你在自动精灵里"录制"出来的点位路线 .zjs 转换成
《脚本_跑刀主控.js》底部可直接使用的 JS 路线数据。

用法:
    python3 zjs2points.py  点位1.zjs 点位2.zjs ... -o 点位路线_生成.js

    - 每个 .zjs 文件 = 一个点位 (文件名去掉 .zjs 就是点位名)
    - 额外参数 --extract 撤离路线.zjs   会生成 EXTRACT_ROUTE
    - 录制的动作里如果含"找图", 图片会被导出到 ./images/ 目录,
      你需要在自动精灵 App「变量-图像」里建同名变量并导入这些图片。

转换规则:
    点击 posData.location  ->  {c:[x%, y%, 按住时长?]}
    滑动 startPos/endPos   ->  {w:[x1%,y1%,x2%,y2%,时长?]}
    找图 (image)           ->  {i:"img_xx_01"}  +  导出图片到 images/
    延时                   ->  {wait: ms}
    其它未知动作           ->  跳过并在日志里提示
    坐标统一换算成 0-100 百分比 (按录制头部的 screenWidth/screenHeight)
"""

import argparse
import base64
import json
import os
import re
import sys

IMG_EXT = ".txt"  # base64 文本, App 内图像变量可直接粘贴/导入


def parse_jsonl(text):
    dec = json.JSONDecoder()
    docs, idx = [], 0
    n = len(text)
    while idx < n:
        while idx < n and text[idx] in " \r\n\t":
            idx += 1
        if idx >= n:
            break
        obj, idx = dec.raw_decode(text, idx)
        docs.append(obj)
    return docs


def to_pct(v, is_x, sw, sh):
    """把录制坐标 (数字px / '50%' / '-10-20%' 抖动串) 归一成 0-100 百分比。"""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        total = sw if is_x else sh
        if total <= 0:
            return float(v)
        return round(float(v) * 100.0 / total, 1)
    s = str(v).strip()
    m = re.match(r"^(-?\d+(?:\.\d+)?)\s*%$", s)
    if m:
        return round(float(m.group(1)), 1)
    # 抖动格式: "-10-20%" 或 "10-20%" —— 取中间值, 抖动交给主控脚本
    m = re.match(r"^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*%$", s)
    if m:
        a, b = float(m.group(1)), float(m.group(2))
        return round((a + b) / 2.0, 1)
    try:
        f = float(s)
        total = sw if is_x else sh
        return round(f * 100.0 / total, 1) if total > 0 else f
    except ValueError:
        return None


def js_num(v):
    if v is None:
        return "null"
    if isinstance(v, float) and v == int(v):
        return str(int(v))
    return repr(v)


def convert_file(path, img_dir, warnings):
    name = os.path.splitext(os.path.basename(path))[0]
    with open(path, encoding="utf-8") as f:
        text = f.read()
    docs = parse_jsonl(text)
    header = docs[0]
    sw = int(header.get("screenWidth", 720) or 720)
    sh = int(header.get("screenHeight", 1280) or 1280)
    steps = []
    img_idx = 0
    for d in docs[1:]:
        if not isinstance(d, dict):
            continue
        t = d.get("type", "")
        delay = d.get("delay")
        if isinstance(delay, str) and delay.isdigit() and int(delay) >= 300:
            steps.append({"wait": min(int(delay), 3000)})

        if t == "点击":
            pos = d.get("posData") or {}
            if pos.get("type") == "location":
                x = to_pct(pos.get("x"), True, sw, sh)
                y = to_pct(pos.get("y"), False, sw, sh)
                if x is not None and y is not None:
                    dur = None
                    dd = d.get("duration")
                    if isinstance(dd, str) and dd.isdigit() and int(dd) > 300:
                        dur = int(dd)
                    steps.append({"c": [x, y] + ([dur] if dur else [])})
                    continue
            elif pos.get("type") == "image":
                img_idx += 1
                var_name = "img_%s_%02d" % (slug(name), img_idx)
                export_image(pos, var_name, img_dir)
                steps.append({"i": var_name})
                continue
            warnings.append("%s: 跳过未知 点击 posData=%s" % (name, json.dumps(pos, ensure_ascii=False)[:120]))
            continue

        if t == "滑动":
            sp = d.get("startPos") or {}
            ep = d.get("endPos") or {}
            x1 = to_pct(sp.get("x"), True, sw, sh)
            y1 = to_pct(sp.get("y"), False, sw, sh)
            x2 = to_pct(ep.get("x"), True, sw, sh)
            y2 = to_pct(ep.get("y"), False, sw, sh)
            if None not in (x1, y1, x2, y2):
                steps.append({"w": [x1, y1, x2, y2]})
                continue
            warnings.append("%s: 跳过无法解析的滑动" % name)
            continue

        if t in ("找图", "找色", "文本", "文字识别"):
            pos = d.get("posData") or {}
            if pos.get("type") == "image" or t == "找图":
                img_idx += 1
                var_name = "img_%s_%02d" % (slug(name), img_idx)
                export_image(pos, var_name, img_dir)
                steps.append({"i": var_name})
                continue
            warnings.append("%s: %s 动作 (非图像) 无法自动转换, 已跳过; 可手工在路线中补 {i:'img_xxx'}" % (name, t))
            continue

        if t in ("延时", "等待"):
            ms = d.get("duration") or d.get("delay") or d.get("value")
            try:
                steps.append({"wait": int(float(str(ms)))})
            except (ValueError, TypeError):
                warnings.append("%s: 延时参数无法解析: %r" % (name, ms))
            continue

        if t == "加密动作":
            warnings.append("%s: 第 %d 步是加密动作(无法解析), 已跳过" % (name, len(steps)))
            continue
        # 其它类型: 不认识的记录下来
        if t:
            warnings.append("%s: 未知动作类型 %r (已跳过)" % (name, t))
    return name, steps


def slug(s):
    s = re.sub(r"[^\w\u4e00-\u9fff]+", "_", s)
    return s.strip("_")[:12]


def export_image(pos, var_name, img_dir):
    os.makedirs(img_dir, exist_ok=True)
    data = None
    for key in ("imageData", "data", "image"):
        v = pos.get(key)
        if isinstance(v, str) and len(v) > 200:
            data = v
            break
        if isinstance(v, dict):
            data = v.get("data")
            break
    if not data:
        # 有的版本把 base64 直接放在 posData 下
        for k, v in pos.items():
            if isinstance(v, str) and len(v) > 200:
                data = v
                break
    out = os.path.join(img_dir, var_name + IMG_EXT)
    with open(out, "w", encoding="utf-8") as f:
        f.write(data or "")
    return out


def js_step(step):
    if "wait" in step:
        return "{wait: %s}" % js_num(step["wait"])
    if "w" in step:
        return "{w: [%s]}" % ", ".join(js_num(v) for v in step["w"])
    if "c" in step:
        return "{c: [%s]}" % ", ".join(js_num(v) for v in step["c"])
    if "i" in step:
        return "{i: '%s'}" % step["i"]
    return None


def emit(points, extract_route, out_path, img_dir, warnings):
    L = []
    L.append("/* 本文件由 tools/zjs2points.py 自动生成, 用于覆盖 脚本_跑刀主控.js 底部数据区 */")
    L.append("/* 分辨率基准: 0-100 百分比, 与录制脚本分辨率无关 */")
    L.append("var POINTS = [")
    for p in points:
        L.append("  { name: '%s', steps: [" % p[0])
        for st in p[1]:
            s = js_step(st)
            if s:
                L.append("    %s," % s)
        L.append("  ] },")
    L.append("];")
    L.append("")
    L.append("var EXTRACT_ROUTE = [")
    for st in extract_route:
        s = js_step(st)
        if s:
            L.append("  %s," % s)
    L.append("];")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(L) + "\n")

    imgs = sorted(os.listdir(img_dir)) if os.path.isdir(img_dir) else []
    if imgs:
        L2 = []
        L2.append("图像变量导入清单 —— 在自动精灵 App「变量-图像」中按下列名字逐个新建变量,")
        L2.append("并把 images/ 目录中对应文件的 base64 内容粘贴/导入:")
        for f in imgs:
            L2.append("  %-28s <- images/%s" % (f[:-4], f))
        with open(os.path.join(os.path.dirname(out_path) or ".", "图像变量导入清单.txt"), "w", encoding="utf-8") as fo:
            fo.write("\n".join(L2) + "\n")


def main():
    ap = argparse.ArgumentParser(description="自动精灵录制 .zjs -> 跑刀主控 JS 路线数据")
    ap.add_argument("files", nargs="+", help="录制的点位 .zjs 文件 (每个文件=一个点位)")
    ap.add_argument("--extract", default=None, help="撤离路线 .zjs 文件 (单独指定)")
    ap.add_argument("-o", "--out", default="点位路线_生成.js", help="输出 JS 文件 (默认 点位路线_生成.js)")
    args = ap.parse_args()

    warnings = []
    img_dir = os.path.join(os.path.dirname(os.path.abspath(args.out)), "images")
    points = []
    extract = []
    for fp in args.files:
        if not os.path.exists(fp):
            print("!! 找不到文件: %s" % fp, file=sys.stderr)
            continue
        name, steps = convert_file(fp, img_dir, warnings)
        points.append((name, steps))
        print("  点位 %-24s -> %d 步" % (name, len(steps)))
    if args.extract:
        if os.path.exists(args.extract):
            name, steps = convert_file(args.extract, img_dir, warnings)
            extract = steps
            print("  撤离路线               -> %d 步" % len(steps))
        else:
            print("!! 找不到撤离路线文件: %s" % args.extract, file=sys.stderr)

    emit(points, extract, args.out, img_dir, warnings)
    print("\n已生成: %s" % args.out)
    if warnings:
        print("\n警告 (%d 条):" % len(warnings))
        for w in warnings:
            print("  - " + w)
    n_imgs = len(os.listdir(img_dir)) if os.path.isdir(img_dir) else 0
    if n_imgs:
        print("导出图像变量 %d 个到 images/ (见 图像变量导入清单.txt)" % n_imgs)
    print("\n下一步: 把 点位路线_生成.js 里的 POINTS / EXTRACT_ROUTE")
    print("替换到 脚本_跑刀主控.js 底部『点位路线』区域, 然后先跑 selfTest()。")


if __name__ == "__main__":
    main()
