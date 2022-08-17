extract_frames() {
    rm frames/*
    ffmpeg -i "$1" -vf fps=30 frames/frame-%07d.jpg
}

merge_frames() {
    echo "files = $files"
    for f in ${files}; do
        composite -blend 92x8 darkroom/target.jpg $f -alpha Set darkroom/target.jpg
    done
}

opt_merge() {

    ls frames/* > framelist
    split -l 50 -a 4 -d framelist chunks/
    for chunk in $(ls chunks); do 
        cp darkroom/target.jpg darkroom/$chunk.jpg
        for file in $(cat chunks/$chunk); do
            composite -blend 92x8 darkroom/$chunk.jpg $file -alpha Set darkroom/$chunk.jpg
        done
    done
    ls chunks > framelist

    for chunk in $(cat framelist); do
        composite -blend 92x8 darkroom/target.jpg darkroom/$chunk.jpg -alpha Set darkroom/target.jpg
    done
  echo ""
}

pair_merge() {
    pwd
    rm chunks/*
    ls halfstep/* > framelist
    split -l 2 -a 4 -d framelist chunks/
    for pair in $(ls chunks); do
        data=$(cat chunks/$pair)
        s1=$(echo "$data" | sed -n '1p')
        s2=$(echo "$data" | sed -n '2p')
        echo "pair $s1 + $s2"
        if [ ! -z "$s2" ]; then
            composite -blend 50x50 $s1 $s2 -alpha Set darkroom/$pair.jpg
        fi
    done

    rm halfstep/*
    mv darkroom/* halfstep/
    count=$(ls chunks | wc -l)
    if [ $count -gt 2 ]; then
        echo "new round from $count"
        pair_merge
    fi
}

#cleaning before start
rm darkroom/*
rm chunks/*
rm halfstep/*
## cleaning end


extract_frames "$1"

cp frames/* halfstep/
files=(frames/*)
echo $files
first="${files[1]}"
cp $first darkroom/target.jpg
#merge_frames
#opt_merge
echo "start merging process"
 #pair_merge
