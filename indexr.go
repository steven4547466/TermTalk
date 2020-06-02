package main

import (
//  "fmt"
  "log"
  "flag"
  "net/url"
  "os"
  "os/signal"
  "time"
//  "encoding/json"
//  "strings"

  ui "github.com/gizak/termui/v3"
  "github.com/gizak/termui/v3/widgets"
  "github.com/gorilla/websocket"
)

var addr = flag.String("addr", "localhost:8080", "http service address")

func main() {
  flag.Parse()
  log.SetFlags(0)

  interrupt := make(chan os.Signal, 1)
  signal.Notify(interrupt, os.Interrupt)

  u := url.URL{Scheme: "ws", Host: *addr, Path: "/"}
  log.Printf("connecting to %s", u.String())

  c, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
  if err != nil {
	log.Fatal("dial:", err)
  }
  defer c.Close()

  if err := ui.Init(); err != nil {
	log.Fatalf("failed to initialize termui: %v", err)
  }
  defer ui.Close()

  l := widgets.NewList()
  l.Title = "Messages"
  l.Rows = []string{}
  l.TextStyle = ui.NewStyle(ui.ColorYellow)
  l.WrapText = false
  l.SetRect(0, 0, 100, 20)

  ui.Render(l)

  uiEvents := ui.PollEvents()
  ticker := time.NewTicker(time.Second).C
	for {
			e := <-uiEvents
				switch e.ID { // event string/identifier
					case "q", "<C-c>": // press 'q' or 'C-c' to quit
						return
				}

      select {
  			case <-ticker:
  				_, message, err := c.ReadMessage()
  				if err != nil {
  					log.Println("read:", err)
  					return
  				}
  				l.Rows = append(l.Rows, BytesToString(message))

  				ui.Render(l)
      }
	}
  /*idebar := tui.NewVBox(
	tui.NewSpacer(),
  )
  sidebar.SetBorder(true)

  history := tui.NewVBox()

  historyScroll := tui.NewScrollArea(history)
  historyScroll.SetAutoscrollToBottom(true)

  historyBox := tui.NewVBox(historyScroll)
  historyBox.SetBorder(true)

  input := tui.NewEntry()
  input.SetFocused(true)
  input.SetSizePolicy(tui.Expanding, tui.Maximum)

  inputBox := tui.NewHBox(input)
  inputBox.SetBorder(true)
  inputBox.SetSizePolicy(tui.Expanding, tui.Maximum)

  chat := tui.NewVBox(historyBox, inputBox)
  chat.SetSizePolicy(tui.Expanding, tui.Expanding)

  input.OnSubmit(func(e *tui.Entry) {
	history.Append(tui.NewHBox(
	  tui.NewPadder(1, 0, tui.NewLabel(fmt.Sprintf("%s >", "sammy"))),
	  tui.NewLabel(e.Text()),
	  tui.NewSpacer(),
	))
	if err := c.WriteMessage(websocket.TextMessage, []byte(fmt.Sprintf("{\"username\": \"sammy\", \"msg\": \"%s\"}", e.Text()))); err != nil {
		  log.Println(err)
		  return
	  }
	input.SetText("")
  })

  root := tui.NewHBox(chat, sidebar)

  ui, err := tui.New(root)
  if err != nil {
	log.Fatal(err)
  }

  ui.SetKeybinding("Esc", func() {
	err := c.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
	  if err != nil {
		log.Println("write close:", err)
		return
	  }
   ui.Quit()
  })

  if err := ui.Run(); err != nil {
	log.Fatal(err)
  }

  for {
	  _, message, err := c.ReadMessage()
	  if err != nil {
		log.Println("read:", err)
		return
	  }
	  log.Println(BytesToString(message))
	  type Data struct {
		username, msg string
	  }
	  dec := json.NewDecoder(strings.NewReader(BytesToString(message)))
	  var d Data
	  dec.Decode(&d)
	 l.Rows = append(l.Rows, "recived")
	 ui.Render(l)
  }*/
}

func BytesToString(data []byte) string {
	return string(data[:])
}